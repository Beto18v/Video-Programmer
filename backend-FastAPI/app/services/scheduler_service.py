"""
Servicio de planificación de horarios con soporte de zona horaria.

Este módulo proporciona funcionalidades para generar horarios distribuidos
en el tiempo con soporte completo de zonas horarias IANA.
"""

from datetime import date, datetime, time

import pytz
from app.models.plan import Plan


class SchedulerService:
    """
    Servicio para generar horarios distribuidos con zona horaria.
    """

    @staticmethod
    def generate_schedule(
        start_date: date,
        times: list[str],
        count: int,
        timezone: str
    ) -> list[datetime]:
        """
        Genera una lista de horarios distribuidos en días consecutivos.

        Distribuye los horarios disponibles por día hasta cubrir el número
        requerido de slots, manteniendo orden ascendente y sin solapamientos.

        Args:
            start_date: Fecha de inicio (sin zona horaria)
            times: Lista de horarios en formato 'HH:MM'
            count: Número total de slots a generar
            timezone: Zona horaria IANA (ej: 'America/Bogota')

        Returns:
            Lista de datetime con zona horaria, ordenados ascendentemente

        Raises:
            ValueError: Si timezone no es válido o times está vacío
        """
        if not times:
            raise ValueError("La lista de horarios no puede estar vacía")

        if count <= 0:
            raise ValueError("El count debe ser mayor que 0")

        # Validar zona horaria
        try:
            tz = pytz.timezone(timezone)
        except pytz.exceptions.UnknownTimeZoneError:
            raise ValueError(f"Zona horaria desconocida: {timezone}")

        # Convertir strings de tiempo a objetos time
        time_objects: list[time] = []
        for time_str in times:
            try:
                hours, minutes = map(int, time_str.split(':'))
                if not (0 <= hours <= 23) or not (0 <= minutes <= 59):
                    raise ValueError
                time_objects.append(time(hours, minutes))
            except ValueError:
                raise ValueError(f"Formato de hora inválido: {time_str}. Use 'HH:MM'")

        # Generar slots
        schedule: list[datetime] = []
        current_date = start_date
        day_index = 0

        while len(schedule) < count:
            # Para cada día, asignar todos los horarios disponibles
            for time_obj in time_objects:
                if len(schedule) >= count:
                    break

                # Crear datetime con zona horaria
                dt_naive = datetime.combine(current_date, time_obj)
                dt_aware = tz.localize(dt_naive)

                schedule.append(dt_aware)

            # Pasar al siguiente día
            current_date = current_date.replace(day=current_date.day + 1)
            day_index += 1

        return schedule

    @staticmethod
    def slots_for_plan(
        plan: Plan,
        start_date: date,
        times: list[str],
        timezone: str
    ) -> dict[int, datetime]:
        """
        Asigna slots de tiempo a cada grupo del plan.

        Args:
            plan: Objeto Plan con los grupos a programar
            start_date: Fecha de inicio
            times: Lista de horarios en formato 'HH:MM'
            timezone: Zona horaria IANA

        Returns:
            Diccionario que mapea índice de grupo a datetime con zona horaria
        """
        # Generar schedule completo para todos los grupos
        total_groups = len(plan.groups)
        schedule = SchedulerService.generate_schedule(
            start_date=start_date,
            times=times,
            count=total_groups,
            timezone=timezone
        )

        # Mapear cada grupo a su slot correspondiente
        slots = {}
        for i, group in enumerate(plan.groups):
            slots[group.index] = schedule[i]

        return slots