"""
Tests para el servicio de planificación de horarios.
"""

import pytest
from datetime import date, datetime
from app.services.scheduler_service import SchedulerService
from app.models.plan import Plan, MediaGroup


class TestSchedulerService:
    """Tests para SchedulerService."""

    def test_generate_schedule_basic(self):
        """Test generación básica de schedule."""
        start_date = date(2025, 10, 15)
        times = ["10:00", "14:00", "18:00"]
        count = 5
        timezone = "America/Bogota"

        schedule = SchedulerService.generate_schedule(
            start_date, times, count, timezone
        )

        assert len(schedule) == 5
        assert all(isinstance(dt, datetime) for dt in schedule)
        assert all(dt.tzinfo is not None for dt in schedule)

        # Verificar orden ascendente
        for i in range(1, len(schedule)):
            assert schedule[i-1] < schedule[i]

        # Verificar distribución: día 1: 10:00, 14:00, 18:00; día 2: 10:00
        expected_times = [
            datetime(2025, 10, 15, 10, 0),  # Día 1, 10:00
            datetime(2025, 10, 15, 14, 0),  # Día 1, 14:00
            datetime(2025, 10, 15, 18, 0),  # Día 1, 18:00
            datetime(2025, 10, 16, 10, 0),  # Día 2, 10:00
            datetime(2025, 10, 16, 14, 0),  # Día 2, 14:00
        ]

        for i, expected in enumerate(expected_times):
            assert schedule[i].replace(tzinfo=None) == expected

    def test_generate_schedule_example_case(self):
        """Test del caso de ejemplo: 21 slots con 3 horarios = 7 días."""
        start_date = date(2025, 10, 15)
        times = ["10:00", "14:00", "18:00"]
        count = 21
        timezone = "America/Bogota"

        schedule = SchedulerService.generate_schedule(
            start_date, times, count, timezone
        )

        assert len(schedule) == 21

        # Verificar que cubre 7 días (21 / 3 = 7)
        days_covered = set()
        for dt in schedule:
            days_covered.add(dt.date())

        assert len(days_covered) == 7

        # Verificar que cada día tiene exactamente los 3 horarios
        day_schedules = {}
        for dt in schedule:
            day = dt.date()
            if day not in day_schedules:
                day_schedules[day] = []
            day_schedules[day].append(dt.time())

        for day, times_in_day in day_schedules.items():
            assert len(times_in_day) == 3
            expected_times = [
                datetime.strptime("10:00", "%H:%M").time(),
                datetime.strptime("14:00", "%H:%M").time(),
                datetime.strptime("18:00", "%H:%M").time(),
            ]
            assert set(times_in_day) == set(expected_times)

    def test_generate_schedule_empty_times(self):
        """Test con lista de tiempos vacía."""
        start_date = date(2025, 10, 15)
        times = []
        count = 5
        timezone = "America/Bogota"

        with pytest.raises(ValueError, match="La lista de horarios no puede estar vacía"):
            SchedulerService.generate_schedule(start_date, times, count, timezone)

    def test_generate_schedule_invalid_timezone(self):
        """Test con zona horaria inválida."""
        start_date = date(2025, 10, 15)
        times = ["10:00"]
        count = 1
        timezone = "Invalid/Timezone"

        with pytest.raises(ValueError, match="Zona horaria desconocida"):
            SchedulerService.generate_schedule(start_date, times, count, timezone)

    def test_generate_schedule_invalid_time_format(self):
        """Test con formato de hora inválido."""
        start_date = date(2025, 10, 15)
        times = ["25:00"]  # Hora inválida
        count = 1
        timezone = "America/Bogota"

        with pytest.raises(ValueError, match="Formato de hora inválido"):
            SchedulerService.generate_schedule(start_date, times, count, timezone)

    def test_generate_schedule_invalid_time_format_2(self):
        """Test con formato de hora inválido (minutos)."""
        start_date = date(2025, 10, 15)
        times = ["10:60"]  # Minutos inválidos
        count = 1
        timezone = "America/Bogota"

        with pytest.raises(ValueError, match="Formato de hora inválido"):
            SchedulerService.generate_schedule(start_date, times, count, timezone)

    def test_generate_schedule_invalid_time_format_3(self):
        """Test con formato de hora inválido (formato)."""
        start_date = date(2025, 10, 15)
        times = ["10-00"]  # Separador inválido
        count = 1
        timezone = "America/Bogota"

        with pytest.raises(ValueError, match="Formato de hora inválido"):
            SchedulerService.generate_schedule(start_date, times, count, timezone)

    def test_generate_schedule_zero_count(self):
        """Test con count cero."""
        start_date = date(2025, 10, 15)
        times = ["10:00"]
        count = 0
        timezone = "America/Bogota"

        with pytest.raises(ValueError, match="El count debe ser mayor que 0"):
            SchedulerService.generate_schedule(start_date, times, count, timezone)

    def test_generate_schedule_negative_count(self):
        """Test con count negativo."""
        start_date = date(2025, 10, 15)
        times = ["10:00"]
        count = -1
        timezone = "America/Bogota"

        with pytest.raises(ValueError, match="El count debe ser mayor que 0"):
            SchedulerService.generate_schedule(start_date, times, count, timezone)

    def test_slots_for_plan(self):
        """Test asignación de slots a un plan."""
        # Crear un plan de ejemplo
        groups = [
            MediaGroup(index=0, inputs=["video1.mp4", "video2.mp4"], output="output1.mp4"),
            MediaGroup(index=1, inputs=["video3.mp4"], output="output2.mp4"),
            MediaGroup(index=2, inputs=["video4.mp4", "video5.mp4"], output="output3.mp4"),
        ]
        plan = Plan(
            groups=groups,
            total_inputs=5,  # video1.mp4, video2.mp4, video3.mp4, video4.mp4, video5.mp4
            total_outputs=3,
        )

        start_date = date(2025, 10, 15)
        times = ["10:00", "14:00"]
        timezone = "America/Bogota"

        slots = SchedulerService.slots_for_plan(plan, start_date, times, timezone)

        assert len(slots) == 3
        assert 0 in slots
        assert 1 in slots
        assert 2 in slots

        # Verificar que son datetime con zona horaria
        for dt in slots.values():
            assert isinstance(dt, datetime)
            assert dt.tzinfo is not None

        # Verificar orden: grupo 0 -> 10:00, grupo 1 -> 14:00, grupo 2 -> 16:00 (día siguiente)
        assert slots[0].hour == 10 and slots[0].minute == 0
        assert slots[1].hour == 14 and slots[1].minute == 0
        assert slots[2].hour == 10 and slots[2].minute == 0  # Día siguiente
        assert slots[2].date() == date(2025, 10, 16)  # Día siguiente