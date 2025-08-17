import { gql } from "@apollo/client";
const createChat = `mutation CreateChat($title: String!) {
      insert_chats_one(object: { title: $title }) {
        id
        title
      }
    }`;

const getChats = gql`
  subscription GetUserChats {
    chats(order_by: { updated_at: desc }) {
      id
      title
      updated_at
    }
  }
`;

const sendMessage = `mutation InsertUserMessage($chat_id: uuid!, $content: String!) {
  insert_messages_one(object: {chat_id: $chat_id, content: $content}) {
    id
  }
}`;

const initateAction = `mutation InitiateAction($chat_id: uuid!,$step: String!, $context:String!){   getBotReply(     chat_id: $chat_id,     step: $step,     context: $context   ){     Success   } }`;

const deleteMessage = `mutation DeleteMessage($id: uuid!) {
  delete_messages_by_pk(id: $id) {
    id
  }
}`;

const getMessages = gql`
  subscription GetChatMessages($chat_id: uuid!) {
    messages(
      where: { chat_id: { _eq: $chat_id } }
      order_by: { created_at: asc }
    ) {
      id
      content
      sender
      created_at
    }
  }
`;

  export { createChat, getChats, sendMessage, getMessages, initateAction,deleteMessage};
