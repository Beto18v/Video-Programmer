"""
Ejemplo de endpoints protegidos con autorización basada en roles.
"""

from fastapi import APIRouter, Depends
from typing import Any

from app.core.authorization import (
    Role,
    PermissionLevel,
    require_roles,
    require_permissions,
    admin_required,
    authenticated_user,
    get_current_active_user
)

router = APIRouter()


@router.get("/public")
async def public_endpoint():
    """Endpoint público - no requiere autenticación."""
    return {"message": "Este es un endpoint público"}


@router.get("/protected")
async def protected_endpoint(current_user: Any = Depends(authenticated_user())):
    """Endpoint protegido - requiere autenticación pero cualquier rol."""
    return {
        "message": "Este endpoint está protegido",
        "user": current_user.get("email", "unknown")
    }


@router.get("/admin-only")
async def admin_only_endpoint(current_user: Any = Depends(admin_required())):
    """Endpoint solo para administradores."""
    return {
        "message": "Solo administradores pueden ver esto",
        "user": current_user.get("email", "unknown")
    }


@router.get("/admin-or-client")
async def multi_role_endpoint(current_user: Any = Depends(require_roles([Role.ADMIN, Role.CLIENT]))):
    """Endpoint para múltiples roles."""
    return {
        "message": "Admins y clientes pueden ver esto",
        "user": current_user.get("email", "unknown"),
        "role": current_user.get("role_id")
    }


@router.get("/read-permission")
async def read_permission_endpoint(current_user: Any = Depends(require_permissions(PermissionLevel.READ))):
    """Endpoint que requiere permiso de lectura."""
    return {
        "message": "Tienes permiso de lectura",
        "data": ["item1", "item2", "item3"]
    }


@router.post("/write-permission")
async def write_permission_endpoint(
    data: dict,
    current_user: Any = Depends(require_permissions(PermissionLevel.WRITE))
):
    """Endpoint que requiere permiso de escritura."""
    return {
        "message": "Datos guardados exitosamente",
        "saved_data": data,
        "user": current_user.get("email", "unknown")
    }


@router.delete("/delete-permission")
async def delete_permission_endpoint(
    item_id: int,
    current_user: Any = Depends(require_permissions(PermissionLevel.DELETE))
):
    """Endpoint que requiere permiso de eliminación."""
    return {
        "message": f"Item {item_id} eliminado",
        "deleted_by": current_user.get("email", "unknown")
    }


@router.post("/admin-action")
async def admin_action_endpoint(
    action: dict,
    current_user: Any = Depends(require_permissions(PermissionLevel.ADMIN))
):
    """Endpoint que requiere permisos de administrador."""
    return {
        "message": "Acción de administrador ejecutada",
        "action": action,
        "executed_by": current_user.get("email", "unknown")
    }


@router.get("/user-info")
async def get_user_info(current_user: Any = Depends(get_current_active_user())):
    """Obtiene información del usuario actual."""
    return {
        "user_id": current_user.get("id"),
        "email": current_user.get("email"),
        "role_id": current_user.get("role_id"),
        "is_active": current_user.get("is_active", True)
    }