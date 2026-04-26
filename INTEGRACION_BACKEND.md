# 🔗 GUÍA DE INTEGRACIÓN FRONTEND-BACKEND

## Configuración de la Conexión

### 1. URL Base del API

Edita el archivo `src/app/core/services/user.service.ts`:

```typescript
// ANTES:
private apiUrl = 'http://localhost:8000/api/users';

// DESPUÉS (actualiza según tu configuración):
private apiUrl = 'http://tu-dominio-backend:puerto/api/users';
```

Edita el archivo `src/app/core/services/department.service.ts`:

```typescript
// ANTES:
private apiUrl = 'http://localhost:8000/api/departments';

// DESPUÉS (actualiza según tu configuración):
private apiUrl = 'http://tu-dominio-backend:puerto/api/departments';
```

### 2. CORS - Habilitar en el Backend

Si el frontend y backend están en dominios diferentes, el backend debe permitir CORS:

**Para Django (fp_backend):**

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "http://localhost:3000",
    "https://tu-dominio-frontend.com",
]

INSTALLED_APPS = [
    # ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ...
]
```

### 3. Configuración de Autenticación (Opcional)

Si usas autenticación JWT, actualiza el interceptor:

```typescript
// src/app/core/auth/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req);
};
```

---

## Estructura de Datos Esperada

### Usuario
```json
{
  "id": 1,
  "name": "Alejandra García",
  "email": "a.mcnicoll@flowpolicy.io",
  "role": "Admin",
  "department": "Infrastructure",
  "status": "Active"
}
```

### Departamento
```json
{
  "id": 1,
  "name": "IT Infrastructure",
  "description": "Gestión de infraestructura tecnológica",
  "manager": "Roberto Díaz",
  "users": 12,
  "status": "Active"
}
```

---

## Endpoints Requeridos

### Usuarios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Obtener todos los usuarios |
| GET | `/api/users/{id}` | Obtener un usuario |
| POST | `/api/users` | Crear usuario |
| PUT | `/api/users/{id}` | Actualizar usuario |
| DELETE | `/api/users/{id}` | Eliminar usuario |

### Departamentos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/departments` | Obtener todos |
| GET | `/api/departments/{id}` | Obtener uno |
| POST | `/api/departments` | Crear departamento |
| PUT | `/api/departments/{id}` | Actualizar |
| DELETE | `/api/departments/{id}` | Eliminar |

---

## Integración en Componentes

### Usar el Servicio en Componentes

**En users.component.ts:**

```typescript
import { UserService } from '../../core/services/user.service';

export class UsersComponent implements OnInit {
  users: User[] = [];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
      }
    });
  }

  deleteUser(id: number): void {
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== id);
        this.applyFilters();
      },
      error: (error) => console.error('Error eliminando usuario:', error)
    });
  }
}
```

**En departments.component.ts:**

```typescript
import { DepartmentService } from '../../core/services/department.service';

export class DepartmentsComponent implements OnInit {
  departments: Department[] = [];

  constructor(private departmentService: DepartmentService) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (data) => {
        this.departments = data;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error cargando departamentos:', error);
      }
    });
  }
}
```

---

## Manejo de Errores

### Ejemplo de Servicio con Manejo de Errores

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'http://localhost:8000/api/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error en getUsers:', error);
        return throwError(() => new Error('Error al cargar usuarios'));
      })
    );
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user).pipe(
      catchError(error => {
        const errorMsg = error.error?.message || 'Error al crear usuario';
        return throwError(() => new Error(errorMsg));
      })
    );
  }
}
```

---

## Testing de la Conexión

### 1. Verificar que el Backend está activo

```bash
# Desde la terminal
curl http://localhost:8000/api/users
```

### 2. Ver las peticiones en DevTools

1. Abre Chrome DevTools (F12)
2. Ve a la pestaña "Network"
3. Filtra por XHR
4. Realiza acciones en la aplicación
5. Verifica las peticiones y respuestas

### 3. Verificar CORS

Si ves errores de CORS, asegúrate que:
- El backend tiene CORS habilitado
- Las URLs coinciden exactamente
- Los métodos HTTP están permitidos

---

## Ejemplo Completo de Backend (Django)

```python
# views.py
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import User, Department
from .serializers import UserSerializer, DepartmentSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, DepartmentViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'departments', DepartmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

---

## Variables de Entorno (Recomendado)

**environment.ts:**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

**environment.prod.ts:**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.tu-dominio.com'
};
```

**Usar en servicios:**
```typescript
import { environment } from '../../environments/environment';

private apiUrl = `${environment.apiUrl}/users`;
```

---

## Testing de Servicios

```typescript
// user.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should fetch users', () => {
    const mockUsers = [
      { id: 1, name: 'Juan', email: 'juan@test.com', ... }
    ];

    service.getUsers().subscribe(users => {
      expect(users.length).toBe(1);
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne('http://localhost:8000/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });
});
```

---

## Checklist de Integración

- [ ] URLs del API configuradas
- [ ] CORS habilitado en backend
- [ ] Backend respondiendo en los endpoints
- [ ] Servicios importados en componentes
- [ ] Respuestas del backend matching con interfaces
- [ ] Manejo de errores implementado
- [ ] DevTools mostrando peticiones correctas
- [ ] Datos apareciendo en la tabla
- [ ] Filtros funcionando con datos reales
- [ ] CRUD básico funcionando

---

## Troubleshooting

### Error: "Access to XMLHttpRequest blocked by CORS policy"
**Solución:** Habilita CORS en el backend

### Error: "404 Not Found"
**Solución:** Verifica que las URLs y endpoints son correctos

### Error: "Request timeout"
**Solución:** Verifica que el backend está corriendo y accesible

### Datos no aparecen en tabla
**Solución:** Comprueba en DevTools que el request es exitoso (200 OK)

---

**Última actualización:** 25 de Abril, 2026
