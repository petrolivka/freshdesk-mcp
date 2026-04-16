# freshdesk-mcp-server

MCP server for the Freshdesk helpdesk API. Provides 60 tools for managing tickets, contacts, companies, conversations, agents, groups, time tracking, knowledge base, satisfaction ratings, and more.

Source: [github.com/petrolivka/freshdesk-mcp](https://github.com/petrolivka/freshdesk-mcp)

## Setup

### Prerequisites

- Node.js >= 18
- Freshdesk account with API access

### Environment Variables

| Variable | Description |
|---|---|
| `FRESHDESK_DOMAIN` | Your Freshdesk subdomain (e.g. `mycompany` for `mycompany.freshdesk.com`) |
| `FRESHDESK_API_KEY` | API key from your Freshdesk profile settings |

### Install & Build

```bash
npm install
npm run build
```

### Claude Code Configuration

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "freshdesk": {
      "command": "node",
      "args": ["path/to/freshdesk-mcp-server/dist/index.js"],
      "env": {
        "FRESHDESK_DOMAIN": "your-subdomain",
        "FRESHDESK_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Available Tools

### Tickets
- `freshdesk_create_ticket` - Create a new ticket
- `freshdesk_get_ticket` - Get ticket by ID (with optional includes)
- `freshdesk_list_tickets` - List tickets with filters and pagination
- `freshdesk_update_ticket` - Update ticket fields
- `freshdesk_delete_ticket` - Delete (trash) a ticket
- `freshdesk_search_tickets` - Search with Freshdesk query language

### Contacts
- `freshdesk_create_contact` - Create a new contact
- `freshdesk_get_contact` - Get contact by ID
- `freshdesk_list_contacts` - List contacts with filters
- `freshdesk_update_contact` - Update contact fields
- `freshdesk_delete_contact` - Soft-delete a contact
- `freshdesk_search_contacts` - Search contacts

### Companies
- `freshdesk_create_company` - Create a new company
- `freshdesk_get_company` - Get company by ID
- `freshdesk_list_companies` - List companies
- `freshdesk_update_company` - Update company fields
- `freshdesk_delete_company` - Delete a company
- `freshdesk_search_companies` - Search companies

### Conversations
- `freshdesk_reply_to_ticket` - Send a reply to a ticket
- `freshdesk_add_note` - Add a note (public or private) to a ticket
- `freshdesk_list_conversations` - List ticket conversations (supports `fetch_all` for complete history)
- `freshdesk_update_conversation` - Update conversation body
- `freshdesk_delete_conversation` - Delete a conversation

### Agents & Groups
- `freshdesk_list_agents` - List agents
- `freshdesk_get_agent` - Get agent by ID
- `freshdesk_get_current_agent` - Get authenticated agent info
- `freshdesk_list_groups` - List groups
- `freshdesk_get_group` - Get group by ID
- `freshdesk_list_roles` - List roles

### Time Entries
- `freshdesk_create_time_entry` - Log time against a ticket
- `freshdesk_list_time_entries` - List time entries with filters
- `freshdesk_update_time_entry` - Update a time entry
- `freshdesk_delete_time_entry` - Delete a time entry
- `freshdesk_toggle_timer` - Start/stop a timer on a time entry

### Fields
- `freshdesk_list_ticket_fields` - List all ticket fields (including custom)
- `freshdesk_list_contact_fields` - List all contact fields (including custom)
- `freshdesk_list_company_fields` - List all company fields (including custom)

### Canned Responses
- `freshdesk_list_canned_response_folders` - List canned response folders
- `freshdesk_list_canned_responses` - List responses in a folder
- `freshdesk_get_canned_response` - Get a specific canned response

### Products & Business Hours
- `freshdesk_list_products` - List all products
- `freshdesk_get_product` - Get product by ID
- `freshdesk_list_business_hours` - List business hour configurations
- `freshdesk_get_business_hours` - Get business hours by ID

### Solutions (Knowledge Base)
- `freshdesk_list_solution_categories` - List KB categories
- `freshdesk_get_solution_category` - Get category by ID
- `freshdesk_list_solution_folders` - List folders in a category
- `freshdesk_get_solution_folder` - Get folder by ID
- `freshdesk_list_solution_articles` - List articles in a folder
- `freshdesk_get_solution_article` - Get article by ID
- `freshdesk_create_solution_article` - Create a KB article
- `freshdesk_update_solution_article` - Update a KB article

### Satisfaction Ratings & SLA
- `freshdesk_list_satisfaction_ratings` - List all CSAT ratings
- `freshdesk_get_ticket_satisfaction_ratings` - Get ratings for a ticket
- `freshdesk_list_sla_policies` - List SLA policies

### Ticket Watchers
- `freshdesk_list_ticket_watchers` - List watchers on a ticket
- `freshdesk_add_ticket_watcher` - Add a watcher to a ticket
- `freshdesk_remove_ticket_watcher` - Remove a watcher from a ticket

### Ticket Bulk Operations
- `freshdesk_bulk_update_tickets` - Update multiple tickets at once
- `freshdesk_merge_tickets` - Merge duplicate tickets

## Search Query Syntax

The search tools use Freshdesk's query language:

```
"priority:3 AND status:2"          # High priority open tickets
"agent_id:123"                      # Tickets assigned to agent
"tag:'billing'"                     # Tickets with tag
"created_at:>'2024-01-01'"         # Created after date
"email:'john@example.com'"          # Contact by email
"name:'Acme Corp'"                  # Company by name
```

## License

MIT
