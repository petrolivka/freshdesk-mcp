import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, handleApiError } from "../services/freshdesk-client.js";

export function registerConversationTools(server: McpServer): void {
  server.registerTool(
    "freshdesk_reply_to_ticket",
    {
      title: "Reply to Freshdesk Ticket",
      description: `Send a reply to a ticket. The reply is sent to the requester and CC'd contacts.

Args:
  - ticket_id (number): Ticket ID
  - body (string): Reply body (HTML supported)
  - cc_emails (string[], optional): CC email addresses
  - bcc_emails (string[], optional): BCC email addresses
  - from_email (string, optional): From email (must be configured in Freshdesk)

Returns: Created conversation object.`,
      inputSchema: {
        ticket_id: z.number().int().describe("Ticket ID"),
        body: z.string().min(1).describe("Reply body (HTML)"),
        cc_emails: z.array(z.string().email()).optional().describe("CC emails"),
        bcc_emails: z.array(z.string().email()).optional().describe("BCC emails"),
        from_email: z.string().email().optional().describe("From email"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const { ticket_id, ...replyData } = params;
        const result = await getClient().post(
          `/tickets/${ticket_id}/reply`,
          replyData
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: handleApiError(error) }],
        };
      }
    }
  );

  server.registerTool(
    "freshdesk_add_note",
    {
      title: "Add Note to Freshdesk Ticket",
      description: `Add a note (internal or public) to a ticket.

Args:
  - ticket_id (number): Ticket ID
  - body (string): Note body (HTML supported)
  - private (boolean, optional): If true, note is internal/private (default: true)
  - notify_emails (string[], optional): Email addresses to notify

Returns: Created note object.`,
      inputSchema: {
        ticket_id: z.number().int().describe("Ticket ID"),
        body: z.string().min(1).describe("Note body (HTML)"),
        private: z.boolean().default(true).describe("Private/internal note"),
        notify_emails: z.array(z.string().email()).optional().describe("Notify emails"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const { ticket_id, ...noteData } = params;
        const result = await getClient().post(
          `/tickets/${ticket_id}/notes`,
          noteData
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: handleApiError(error) }],
        };
      }
    }
  );

  server.registerTool(
    "freshdesk_list_conversations",
    {
      title: "List Ticket Conversations",
      description: `List all conversations (replies and notes) for a ticket.

Args:
  - ticket_id (number): Ticket ID
  - page (number, optional): Page number (default: 1)
  - per_page (number, optional): Results per page, max 100 (default: 30)

Returns: Array of conversation objects.`,
      inputSchema: {
        ticket_id: z.number().int().describe("Ticket ID"),
        page: z.number().int().min(1).default(1).describe("Page number"),
        per_page: z.number().int().min(1).max(100).default(30).describe("Results per page"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const result = await getClient().get(
          `/tickets/${params.ticket_id}/conversations`,
          { page: params.page, per_page: params.per_page }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: handleApiError(error) }],
        };
      }
    }
  );

  server.registerTool(
    "freshdesk_update_conversation",
    {
      title: "Update Freshdesk Conversation",
      description: `Update an existing conversation (reply or note) body.

Args:
  - conversation_id (number): Conversation ID
  - body (string): New body (HTML)

Returns: Updated conversation object.`,
      inputSchema: {
        conversation_id: z.number().int().describe("Conversation ID"),
        body: z.string().min(1).describe("New body (HTML)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const result = await getClient().put(
          `/conversations/${params.conversation_id}`,
          { body: params.body }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: handleApiError(error) }],
        };
      }
    }
  );

  server.registerTool(
    "freshdesk_delete_conversation",
    {
      title: "Delete Freshdesk Conversation",
      description: `Delete a conversation (reply or note).

Args:
  - conversation_id (number): Conversation ID

Returns: Confirmation message.`,
      inputSchema: {
        conversation_id: z.number().int().describe("Conversation ID"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        await getClient().delete(`/conversations/${params.conversation_id}`);
        return {
          content: [
            {
              type: "text",
              text: `Conversation ${params.conversation_id} deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: handleApiError(error) }],
        };
      }
    }
  );
}
