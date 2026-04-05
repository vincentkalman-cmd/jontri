"""Base class for all Jontri services."""

from abc import ABC, abstractmethod


class BaseService(ABC):
    """Every service follows the same pattern: configure → run → report."""

    name: str = ""
    description: str = ""
    category: str = ""

    @abstractmethod
    def configure(self, client_config: dict, **kwargs) -> dict:
        """Validate config and return resolved settings for this run."""
        ...

    @abstractmethod
    def run(self, client_slug: str, config: dict, dry_run: bool = True, **kwargs) -> dict:
        """Execute the service. Returns a result dict with status and details."""
        ...

    def status_summary(self, result: dict) -> str:
        """One-line summary for display."""
        return f"{self.name}: {result.get('status', 'unknown')}"
