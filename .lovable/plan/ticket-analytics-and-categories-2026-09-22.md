# Ticket analytics and categories

## What will change
- Add a required ticket category: Hardware, Software, or Access.
- Let people choose the category when filing a ticket and change it when updating one.
- Categorize existing tickets automatically so the charts have complete data.
- Add a daily ticket-volume chart and an open-ticket category pie chart above the ticket list.
- Keep all ticket data private to the current browser and preserve the existing no-login flow.

## Technical details
- Add a validated `category` column to the existing tickets table without changing its locked-down access rules.
- Extend the existing server-side validation and private ticket functions to read and write categories.
- Build both charts with Recharts from the already-loaded ticket data, including empty states and mobile-friendly sizing.
- Verify category editing, ticket creation, chart rendering, and persistence after reload.
