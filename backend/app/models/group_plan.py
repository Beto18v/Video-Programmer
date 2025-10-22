from pydantic import BaseModel, Field


class MediaGroup(BaseModel):
    """Representa un grupo de archivos multimedia para concatenar."""
    index: int = Field(..., description="Índice del grupo (1-based)")
    inputs: list[str] = Field(..., description="Lista de rutas de archivos de entrada")
    output: str = Field(..., description="Ruta del archivo de salida")


class Plan(BaseModel):
    """Plan completo de agrupamiento de archivos multimedia."""
    groups: list[MediaGroup] = Field(..., description="Lista de grupos de medios")
    total_inputs: int = Field(..., description="Número total de archivos de entrada")
    total_outputs: int = Field(..., description="Número total de archivos de salida")