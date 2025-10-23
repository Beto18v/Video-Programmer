"""
Sistema de autorización basado en roles para FastAPI.
Provides decorators and dependencies for role-based access control.
"""

from enum import Enum
from functools import wraps
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .roles import ADMIN_ROLE_ID, CLIENT_ROLE_ID, ADMIN_ROLE_NAME, CLIENT_ROLE_NAME


class Role(str, Enum):
    """Enum para roles del sistema."""
    ADMIN = ADMIN_ROLE_NAME
    CLIENT = CLIENT_ROLE_NAME


class PermissionLevel(str, Enum):
    """Niveles de permisos en el sistema."""
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    ADMIN = "admin"


# Mapeo de roles a permisos
ROLE_PERMISSIONS = {
    Role.ADMIN: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.DELETE, PermissionLevel.ADMIN],
    Role.CLIENT: [PermissionLevel.READ, PermissionLevel.WRITE]
}

security = HTTPBearer()


def get_current_user():
    """
    Dependency para obtener el usuario actual desde el token JWT.
    """
    def _get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Any:
        try:
            from ..services.auth_service import AuthService
            token = credentials.credentials
            user = AuthService.verify_token(token)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token inválido o expirado",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return user
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No se pudo validar las credenciales",
                headers={"WWW-Authenticate": "Bearer"},
            )
    return _get_current_user


def get_current_active_user():
    """
    Dependency para obtener un usuario activo.
    """
    def _get_current_active_user(current_user: Any = Depends(get_current_user())) -> Any:
        if not getattr(current_user, 'is_active', True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuario inactivo"
            )
        return current_user
    return _get_current_active_user


def require_roles(allowed_roles: list[Role] | Role):
    """
    Decorator/dependency para requerir roles específicos.
    
    Args:
        allowed_roles: Role o lista de roles permitidos
    
    Returns:
        FastAPI dependency function
    """
    if isinstance(allowed_roles, Role):
        allowed_roles = [allowed_roles]
    
    def _check_roles(current_user: Any = Depends(get_current_active_user())) -> Any:
        user_role_id = getattr(current_user, 'role_id', None)
        
        # Mapear role_id a role name
        user_role = None
        if user_role_id == ADMIN_ROLE_ID:
            user_role = Role.ADMIN
        elif user_role_id == CLIENT_ROLE_ID:
            user_role = Role.CLIENT
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Roles requeridos: {', '.join(allowed_roles)}"
            )
        
        return current_user
    
    return _check_roles


def require_permissions(required_permissions: list[PermissionLevel] | PermissionLevel):
    """
    Decorator/dependency para requerir permisos específicos.
    
    Args:
        required_permissions: Permiso o lista de permisos requeridos
    
    Returns:
        FastAPI dependency function
    """
    if isinstance(required_permissions, PermissionLevel):
        required_permissions = [required_permissions]
    
    def _check_permissions(current_user: Any = Depends(get_current_active_user())) -> Any:
        user_role_id = getattr(current_user, 'role_id', None)
        
        # Mapear role_id a role name
        user_role = None
        if user_role_id == ADMIN_ROLE_ID:
            user_role = Role.ADMIN
        elif user_role_id == CLIENT_ROLE_ID:
            user_role = Role.CLIENT
        
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario sin rol asignado"
            )
        
        user_permissions = ROLE_PERMISSIONS.get(user_role, [])
        
        # Verificar si el usuario tiene todos los permisos requeridos
        missing_permissions = [perm for perm in required_permissions if perm not in user_permissions]
        
        if missing_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permisos insuficientes. Permisos faltantes: {', '.join(missing_permissions)}"
            )
        
        return current_user
    
    return _check_permissions


def admin_required():
    """Shortcut para requerir rol de administrador."""
    return require_roles(Role.ADMIN)


def authenticated_user():
    """Shortcut para requerir usuario autenticado (cualquier rol)."""
    return get_current_active_user()


# Decoradores para funciones (no endpoints)
def requires_role(allowed_roles: list[Role] | Role):
    """
    Decorator para funciones que requieren roles específicos.
    """
    if isinstance(allowed_roles, Role):
        allowed_roles = [allowed_roles]
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Buscar current_user en los argumentos
            current_user = kwargs.get('current_user')
            if not current_user:
                # Buscar en args si no está en kwargs
                for arg in args:
                    if hasattr(arg, 'role_id'):
                        current_user = arg
                        break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuario no autenticado"
                )
            
            user_role_id = getattr(current_user, 'role_id', None)
            user_role = None
            if user_role_id == ADMIN_ROLE_ID:
                user_role = Role.ADMIN
            elif user_role_id == CLIENT_ROLE_ID:
                user_role = Role.CLIENT
            
            if user_role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Acceso denegado. Roles requeridos: {', '.join(allowed_roles)}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator