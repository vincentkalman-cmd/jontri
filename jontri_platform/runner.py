"""Service runner — deploy and run any service for any client."""

from jontri_platform.clients import load_client_config, client_status
from jontri_platform.services.registry import get_service
from jontri_platform.db import update_service_status


def deploy(client_slug: str, service_name: str, dry_run: bool = True, **kwargs) -> dict:
    """Configure and run a service for a client."""
    client = client_status(client_slug)
    if not client:
        raise ValueError(f"Client '{client_slug}' not found. Run: jontri new-client")

    service = get_service(service_name)
    client_config = load_client_config(client_slug)

    # Configure
    config = service.configure(client_config, **kwargs)

    # Run
    result = service.run(client_slug, config, dry_run=dry_run, **kwargs)

    # Update status in DB
    update_service_status(client_slug, service_name, result.get("status", "unknown"), result)

    print(f"\n  {service.status_summary(result)}")
    return result


def deploy_all_clients(service_name: str, dry_run: bool = True, **kwargs) -> dict:
    """Run a service for every active client."""
    from jontri_platform.clients import list_clients

    clients = list_clients(status_filter="active")
    results = {}
    for client in clients:
        slug = client["slug"]
        print(f"\n{'='*50}")
        print(f"Client: {client['name']} ({slug})")
        print(f"{'='*50}")
        try:
            results[slug] = deploy(slug, service_name, dry_run=dry_run, **kwargs)
        except Exception as e:
            print(f"  ERROR: {e}")
            results[slug] = {"status": "error", "error": str(e)}
    return results
