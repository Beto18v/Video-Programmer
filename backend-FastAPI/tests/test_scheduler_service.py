import pytest
from datetime import date, datetime
from app.services.scheduler_service import SchedulerService


class TestSchedulerService:
    """Pruebas para el servicio de planificación de horarios."""

    def test_generate_schedule_21_slots(self):
        """Prueba generación de 21 slots en 7 días con 3 horarios por día."""
        start_date = date(2025, 10, 13)
        times = ["10:00", "14:00", "18:00"]
        timezone = "America/Bogota"

        schedule = SchedulerService.generate_schedule(start_date, times, 21, timezone)

        # Verificar que se generaron 21 slots
        assert len(schedule) == 21

        # Verificar que todos son datetime con zona horaria
        assert all(isinstance(dt, datetime) for dt in schedule)
        assert all(dt.tzinfo is not None for dt in schedule)

        # Verificar orden ascendente
        for i in range(1, len(schedule)):
            assert schedule[i-1] < schedule[i]

        # Verificar distribución: 7 días × 3 horarios = 21
        # Los primeros 3 deberían ser del día 1, etc.
        days = {}
        for dt in schedule:
            day = dt.date()
            days[day] = days.get(day, 0) + 1

        # Debería haber 7 días con 3 slots cada uno
        assert len(days) == 7
        assert all(count == 3 for count in days.values())

    def test_generate_schedule_empty_times(self):
        """Prueba que lista de horarios vacía lanza ValueError."""
        start_date = date(2025, 10, 13)
        with pytest.raises(ValueError, match="La lista de horarios no puede estar vacía"):
            _ = SchedulerService.generate_schedule(start_date, [], 5, "UTC")

    def test_generate_schedule_zero_count(self):
        """Prueba que count cero lanza ValueError."""
        start_date = date(2025, 10, 13)
        times = ["10:00"]
        with pytest.raises(ValueError, match="El count debe ser mayor que 0"):
            _ = SchedulerService.generate_schedule(start_date, times, 0, "UTC")

    def test_generate_schedule_invalid_timezone(self):
        """Prueba que zona horaria inválida lanza ValueError."""
        start_date = date(2025, 10, 13)
        times = ["10:00"]
        with pytest.raises(ValueError, match="Zona horaria desconocida"):
            _ = SchedulerService.generate_schedule(start_date, times, 1, "Invalid/Timezone")

    def test_generate_schedule_invalid_time_format(self):
        """Prueba que formato de hora inválido lanza ValueError."""
        start_date = date(2025, 10, 13)
        times = ["25:00"]  # Hora inválida
        with pytest.raises(ValueError, match="Formato de hora inválido"):
            _ = SchedulerService.generate_schedule(start_date, times, 1, "UTC")