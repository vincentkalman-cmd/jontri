"""Jontri Platform CLI — one command to manage everything."""

import argparse
import json
import sys
import os

# Ensure project root is on path
PROJECT_ROOT = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, PROJECT_ROOT)


def cmd_new_client(args):
    from jontri_platform.clients import create_client
    slug = create_client(
        name=args.name,
        industry=args.industry,
        contact_name=args.contact_name or "",
        contact_email=args.contact_email or "",
        contact_phone=args.contact_phone or "",
        description=args.description or "",
    )
    print(f"\n  Client created: {slug}")
    print(f"  Config: clients/{slug}/config.json")
    print(f"\n  Next: edit the config, then deploy services:")
    print(f"    python -m platform.cli deploy {slug} prospector")
    print(f"    python -m platform.cli deploy {slug} voice-agent")


def cmd_list_clients(args):
    from jontri_platform.clients import list_clients
    clients = list_clients()
    if not clients:
        print("No clients yet. Create one:")
        print("  python -m platform.cli new-client \"My Client\" --industry hvac")
        return

    print(f"\n  {'NAME':<30} {'INDUSTRY':<15} {'SERVICES':<20} {'STATUS'}")
    print(f"  {'─'*30} {'─'*15} {'─'*20} {'─'*10}")
    for c in clients:
        services = list(c.get("services", {}).keys())
        svc_str = ", ".join(services) if services else "none"
        print(f"  {c['name']:<30} {c.get('industry', ''):<15} {svc_str:<20} {c.get('status', 'active')}")
    print(f"\n  Total: {len(clients)} clients")


def cmd_status(args):
    from jontri_platform.clients import client_status
    client = client_status(args.client)
    if not client:
        print(f"Client '{args.client}' not found.")
        return

    print(f"\n  Client: {client['name']}")
    print(f"  Slug: {client['slug']}")
    print(f"  Industry: {client.get('industry', 'N/A')}")
    print(f"  Status: {client.get('status', 'active')}")
    contact = client.get("contact", {})
    if contact.get("email"):
        print(f"  Contact: {contact.get('name', '')} <{contact['email']}>")
    print(f"  Created: {client.get('created_at', 'N/A')}")

    services = client.get("services", {})
    if services:
        print(f"\n  Services:")
        for name, info in services.items():
            status = info.get("status", "unknown")
            updated = info.get("updated_at", "")
            print(f"    {name:<20} {status:<15} {updated}")
    else:
        print(f"\n  No services deployed yet.")


def cmd_services(args):
    from jontri_platform.services.registry import list_services
    services = list_services()
    print(f"\n  {'SERVICE':<20} {'CATEGORY':<20} DESCRIPTION")
    print(f"  {'─'*20} {'─'*20} {'─'*40}")
    for s in services:
        print(f"  {s['name']:<20} {s['category']:<20} {s['description']}")
    print(f"\n  {len(services)} services available")


def cmd_deploy(args):
    from jontri_platform.runner import deploy
    kwargs = {}
    if args.csv:
        kwargs["csv_path"] = args.csv
    if args.min_score:
        kwargs["min_score"] = args.min_score
    if args.send_emails:
        kwargs["send_emails"] = True

    result = deploy(
        client_slug=args.client,
        service_name=args.service,
        dry_run=not args.live,
        **kwargs,
    )

    print(f"\n  Result: {result.get('status', 'unknown')}")


def cmd_run_all(args):
    from jontri_platform.runner import deploy_all_clients
    kwargs = {}
    if hasattr(args, "send_emails") and args.send_emails:
        kwargs["send_emails"] = True

    results = deploy_all_clients(
        service_name=args.service,
        dry_run=not args.live,
        **kwargs,
    )

    print(f"\n{'='*50}")
    print(f"  Ran '{args.service}' for {len(results)} clients")
    for slug, result in results.items():
        print(f"    {slug}: {result.get('status', 'unknown')}")


def cmd_remove_client(args):
    from jontri_platform.clients import remove_client
    if remove_client(args.client):
        print(f"  Removed client '{args.client}' from database.")
        print(f"  Note: client config files in clients/{args.client}/ were not deleted.")
    else:
        print(f"  Client '{args.client}' not found.")


def main():
    parser = argparse.ArgumentParser(
        prog="jontri",
        description="Jontri Consulting — AI Automation Platform",
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # new-client
    p = subparsers.add_parser("new-client", help="Create a new client")
    p.add_argument("name", help="Client/business name")
    p.add_argument("--industry", required=True, help="Client industry")
    p.add_argument("--contact-name", help="Primary contact name")
    p.add_argument("--contact-email", help="Primary contact email")
    p.add_argument("--contact-phone", help="Primary contact phone")
    p.add_argument("--description", help="Business description")
    p.set_defaults(func=cmd_new_client)

    # list-clients
    p = subparsers.add_parser("list-clients", help="List all clients")
    p.set_defaults(func=cmd_list_clients)

    # status
    p = subparsers.add_parser("status", help="Show client status")
    p.add_argument("client", help="Client slug")
    p.set_defaults(func=cmd_status)

    # services
    p = subparsers.add_parser("services", help="List available services")
    p.set_defaults(func=cmd_services)

    # deploy
    p = subparsers.add_parser("deploy", help="Deploy a service for a client")
    p.add_argument("client", help="Client slug")
    p.add_argument("service", help="Service name (e.g., prospector, voice-agent)")
    p.add_argument("--live", action="store_true", help="Actually execute (default is dry run)")
    p.add_argument("--csv", help="[prospector] Path to Apollo CSV")
    p.add_argument("--min-score", type=int, help="[prospector] Min AI qualification score")
    p.add_argument("--send-emails", action="store_true", help="[prospector] Push to Instantly")
    p.set_defaults(func=cmd_deploy)

    # run-all
    p = subparsers.add_parser("run-all", help="Run a service for ALL active clients")
    p.add_argument("service", help="Service name")
    p.add_argument("--live", action="store_true", help="Actually execute")
    p.add_argument("--send-emails", action="store_true", help="[prospector] Push to Instantly")
    p.set_defaults(func=cmd_run_all)

    # remove-client
    p = subparsers.add_parser("remove-client", help="Remove a client from the database")
    p.add_argument("client", help="Client slug")
    p.set_defaults(func=cmd_remove_client)

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        return

    args.func(args)


if __name__ == "__main__":
    main()
