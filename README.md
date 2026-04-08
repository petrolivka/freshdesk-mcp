# freshdesk-mcp-server

MCP server for the Freshdesk helpdesk API. Provides tools for managing tickets, contacts, companies, conversations, agents, and groups.

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
- `freshdesk_list_conversations` - List ticket conversations
- `freshdesk_update_conversation` - Update conversation body
- `freshdesk_delete_conversation` - Delete a conversation

### Agents & Groups
- `freshdesk_list_agents` - List agents
- `freshdesk_get_agent` - Get agent by ID
- `freshdesk_get_current_agent` - Get authenticated agent info
- `freshdesk_list_groups` - List groups
- `freshdesk_get_group` - Get group by ID
- `freshdesk_list_roles` - List roles

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
