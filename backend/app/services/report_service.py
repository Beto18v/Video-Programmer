import json
from pathlib import Path
from typing import Any
from datetime import datetime
from loguru import logger


class ReportService:
    def __init__(self, report_path: Path):
        self.report_path: Path = report_path
        self._ensure_report_exists()

    def _ensure_report_exists(self):
        """Ensure the report file exists with proper structure."""
        if not self.report_path.exists():
            self.report_path.parent.mkdir(parents=True, exist_ok=True)
            initial_data: dict[str, list[dict[str, Any]]] = {"items": []}
            with open(self.report_path, 'w', encoding='utf-8') as f:
                json.dump(initial_data, f, indent=2, ensure_ascii=False)
            logger.info(f"Created new report file at {self.report_path}")

    def _load_report(self) -> dict[str, Any]:
        """Load the report data from file."""
        try:
            with open(self.report_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            logger.warning(f"Error loading report: {e}. Creating new report.")
            self._ensure_report_exists()
            return {"items": []}

    def _save_report(self, data: dict[str, Any]):
        """Save the report data to file."""
        try:
            with open(self.report_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving report: {e}")

    def append_entry(self, item: dict[str, Any]):
        """
        Append or update an entry in the report by output_path.

        Expected item structure:
        {
            "output_path": str,
            "yt_video_id": str (optional),
            "yt_url": str (optional),
            "yt_publish_at": str (optional),
            "tiktok_status": str (optional),
            "tiktok_video_id": str (optional),
            "scheduled_at": str (optional),
            "created_at": str (optional),
            "errors": list[str] (optional)
        }
        """
        data = self._load_report()
        items: list[dict[str, Any]] = data.get("items", [])

        # Find existing entry by output_path
        existing_index = None
        for i, existing_item in enumerate(items):
            if existing_item.get("output_path") == item.get("output_path"):
                existing_index = i
                break

        # Set created_at if not provided and it's a new entry
        if existing_index is None and "created_at" not in item:
            item["created_at"] = datetime.now().isoformat()

        # Ensure errors is a list
        if "errors" not in item:
            item["errors"] = []
        elif not isinstance(item["errors"], list):
            item["errors"] = [str(item["errors"])]

        if existing_index is not None:
            # Update existing entry
            existing_item = items[existing_index]
            # Merge the new data
            for key, value in item.items():
                if key == "errors" and existing_item.get("errors"):
                    # Append to existing errors
                    existing_item["errors"].extend(value)
                else:
                    existing_item[key] = value
            logger.info(f"Updated report entry for {item.get('output_path')}")
        else:
            # Add new entry
            items.append(item)
            logger.info(f"Added new report entry for {item.get('output_path')}")

        data["items"] = items
        self._save_report(data)

    def get_all_entries(self) -> list[dict[str, Any]]:
        """Get all report entries."""
        data = self._load_report()
        return data.get("items", [])

    def get_entry_by_output_path(self, output_path: str):
        """Get a specific entry by output_path."""
        items = self.get_all_entries()
        for item in items:
            if item.get("output_path") == output_path:
                return item
        return None