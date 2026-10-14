# Chatbot — React + TypeScript

A chat workspace built with React, Vite, and TypeScript, with a conversation
sidebar and an animated CSS 3D background. The frontend requests `/api/chat`;
the local server validates conversation history and requests replies from
Gemini 3.5 Flash-Lite. Keep the server and Vite running together.
Conversations are held in memory and reset on refresh.

## Run the app

Use Node.js 22.13 or newer within the Node 22 release line (or a supported newer LTS).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

```sh
npm run typecheck # Check TypeScript without generating files
npm run lint      # Check code quality and React rules
npm run test:server # Check Gemini conversion and error handling with mocked requests
npm run build     # Check types, then create the production bundle
npm run preview   # Serve the production bundle locally
```

## Lesson 1: TypeScript and reliable messaging

TypeScript checks JavaScript before the app runs. It does not change how React
works, and types are removed from the browser bundle. Files containing JSX use
`.tsx`; files containing only TypeScript use `.ts`.

### 1. Describe the data

Start with `src/types/chat.ts`:

```ts
export type Message = {
  id: string;
  sender: 'user' | 'robot';
  text: string;
};
```

A type describes the shape of a value. Every message needs all three fields.
The sender uses a union: it can be either of these two strings. A typo such as
`sender: 'bot'` produces a type error.

`id` identifies the message in our data. React's `key={message.id}` uses that ID
to track the rendered item; `key` is a special React attribute, not a normal prop.

### 2. Type React state

In `src/hooks/useChat.ts`:

```tsx
const [conversations, setConversations] = useState<Conversation[]>(() => [makeConversation()]);
```

`Message[]` means an array of messages; `Conversation[]` means an array of
conversations. Each conversation contains its own messages and error. The type
argument tells TypeScript what belongs in the array.

Types such as `Message` use `import type`, because they are only needed during
checking, not while the app runs.

### 3. Type component props

In `ChatMessages.tsx`, `ChatMessagesProps` says that the component must receive
`chatMessages: Message[]`. In `ChatMessage.tsx`, `Pick<Message, 'text' | 'sender'>`
reuses just two fields from the existing type. We do not have to define them twice.

`ChatInputProps` defines an `onSend` callback and an `isLoading` flag. The input
does not need access to the conversation state setter.

### 4. Type browser events and DOM references

```tsx
function handleChange(event: ChangeEvent<HTMLInputElement>) {
  setSavedInput(event.target.value);
}
```

The event is now explicitly passed to the handler. Its type tells TypeScript
that `event.target` is an input element, so accessing its `value` is valid.

The form's submit event uses `FormEvent<HTMLFormElement>`. `preventDefault()`
prevents the browser from reloading the page. Clicking Send and pressing Enter
both submit the same form.

`useRef<HTMLDivElement>(null)` describes the message container's DOM reference.
It starts as `null`, so we check that the element exists before scrolling it.

### 5. Handle asynchronous replies

The send function:

1. Trims input and ignores blank messages or an active request.
2. Adds the user's message and a temporary loading message.
3. Awaits the chatbot reply in `try`.
4. Replaces the loading message by its ID.
5. Removes the loading message and displays an error in `catch` if the request fails.
6. Clears the pending state in `finally`, whether the request succeeds or fails.

`setConversations(previous => ...)` uses the latest state rather than a captured
older array. A ref blocks duplicate submissions immediately; state updates the
button's appearance. These serve different purposes.

The error state is `string | null`: it holds either an error message or no error.
TypeScript does not validate external API data at runtime; we will address that
when we introduce Gemini.

## Try it yourself

- Send a message using Enter, then try the button;
  expect an AI reply or a specific server error if Google is unavailable.
- Enter only spaces: Send should stay disabled.
- Send a message and click repeatedly while loading: only one request should run.
- Type your next message while waiting: the draft should stay in the input.
- Resize the browser to a narrow width and send a long word: it should wrap.
- Temporarily change a sender to `'bot'`, run `npm run typecheck`, read the error,
  then restore it to `'user'` or `'robot'`.

The failure branch requires a rejected request. To try it locally, temporarily
replace the `getChatReply(history)` call inside `useChat`'s `try` with `await Promise.reject(new Error('Test'))`.
Check that the error appears, the loading bubble disappears, and you can send again.
Restore the original call afterward.

## Lesson 2: Components, hooks, and services

```text
src/
├── components/
│   ├── ChatInput.tsx
│   ├── ChatMessage.tsx
│   ├── ChatMessages.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── AnimatedBackground.tsx
├── hooks/
│   └── useChat.ts
├── services/
│   └── chatApi.ts
├── types/
│   └── chat.ts
├── assets/
├── App.tsx
├── App.css
├── index.css
└── main.tsx
```

### Components display the interface

`ChatInput` owns only the text being typed. It receives two props:

```ts
type ChatInputProps = {
  onSend: (text: string) => Promise<boolean>;
  isLoading: boolean;
};
```

`onSend` is a callback: a function provided by the parent. The input calls it when
the user submits the form. `Promise<boolean>` means the function completes
asynchronously and tells the input whether sending succeeded. The input clears
its draft on submission and restores it after failure if no new draft was typed.

`isLoading` comes from the parent and controls the Send button. The input knows
nothing about the chatbot library or how messages are stored.

### A custom hook manages React logic

`useChat` is a function that calls React hooks (`useState` and `useRef`) and returns
the conversation data and actions. Custom hook names start with `use`, and they
must be called at the top level of a component or another hook.

```tsx
const { activeConversation, isLoading, sendMessage } = useChat();
```

This is object destructuring: it extracts named values from the hook's returned
object. `App` gives the active conversation's messages to `ChatMessages`, displays
its error, and passes
`sendMessage` to the input as `onSend`.

Each call to `useChat` has its own state. We call it once in `App` so the message
list and input both use the same conversation.

### A service gets data

`services/chatApi.ts` exposes:

```ts
export async function getChatReply(messages: Message[]): Promise<string> {
  // POST conversation history to /api/chat, validate and return its reply.
}
```

A service here is simply a module containing a function. It uses no React hooks
and returns data rather than JSX. It sends an HTTP request to `/api/chat`. The
request body is `{ messages }`, and a successful response must be JSON with a
nonempty `reply` string. Invalid replies and failed requests become errors the
hook can display. The endpoint calls Gemini and returns either `{ reply }` or a safe `{ error }`
with an appropriate HTTP status.

The hook calls this function without needing to know how the reply is generated.

### Follow one message

1. You type; `ChatInput` updates its local draft.
2. You submit; `ChatInput` calls `onSend(text)`.
3. That callback is `useChat`'s `sendMessage` function.
4. The hook adds the user and loading messages, then calls `getChatReply` with conversation history.
5. The service returns a reply; the hook updates its state.
6. React renders the updated conversation through `App` and `ChatMessages`.

Try reading the files in this order: `App.tsx`, `ChatInput.tsx`, `useChat.ts`, then
`chatApi.ts`. Find where the callback is passed, called, and defined.

## Lesson 3: Sidebar and CSS 3D

`Conversation` groups a title, messages, and an error under one ID. The hook tracks
which conversation is active. `Sidebar` receives the list and callbacks to create
or select a chat. Replies update the conversation ID captured when sending, so
switching chats does not route a response into the wrong conversation.

`ChatInput` has `key={activeConversation.id}`. This resets the draft when switching
conversations so text from one chat does not appear in another.

`AnimatedBackground` renders six faces for each cube. CSS `perspective` gives the
scene depth; `transform-style: preserve-3d` keeps the faces in 3D space. Each face
uses a rotation and `translateZ` to form a cube. Keyframes rotate the whole cube.
No 3D library or canvas is needed. The decorative layer ignores pointer events
and is hidden from assistive technology. You can pause it, and users who prefer
reduced motion see stationary cubes.

On narrow screens, the sidebar becomes a compact navigation bar with a horizontal
conversation list. Conversations are not saved to localStorage yet.

Try creating two conversations and switching between them. Send a message in one
and confirm its messages and any error stay with that conversation. Pause the
background and test the layout at a phone width.

## Lesson 4, part 1: A small Node server

Before this step, only Vite served the browser app. There was no server handler
for `/api/chat`. Now `server/index.ts` uses Node's built-in HTTP module to listen
at `http://127.0.0.1:3001`.

Start it in a second terminal:

```sh
npm run server
```

Restart this command after editing server files. Node runs this TypeScript file
using type stripping; it removes type syntax but does not check types. On the
current Node version, an experimental warning is expected. `npm run typecheck`
checks both the browser code and the server code separately.

The server checks the request path and method:

- `POST /api/chat` returns status `503` and `{ "error": "Gemini is not configured yet." }`.
- Other methods at `/api/chat` return `405` with `Allow: POST`.
- Unknown paths return `404`.

`response.setHeader` tells the client the response is JSON. `writeHead` sets the
HTTP status. `response.end` sends the body and finishes the request. This first
endpoint deliberately does not process messages or contact Gemini yet.

`tsconfig.server.json` uses Node types rather than browser DOM types. The new
`@types/node` development dependency supplies definitions for Node modules.
The ESLint configuration now recognizes server globals such as `console`.

You can inspect the setup response:

```sh
curl -i -X POST http://127.0.0.1:3001/api/chat
```

Opening that URL in the browser sends GET, so you will see the method error.
Vite forwards frontend `/api` requests to this server through its development
proxy. Keep both `npm run server` and `npm run dev` running.

## Lesson 4, part 2: Private configuration

`server/.env` holds `GEMINI_API_KEY=`. Add your replacement key after the equals
sign locally; do not share it in chat. This file is ignored by Git.
`server/.env.example` contains an empty placeholder and can be committed. On a
fresh checkout, copy the example to `server/.env` before starting the server.

`npm run server` now uses Node's `--env-file=server/.env` option. Node loads the
file into `process.env`, which the server reads. Startup logs report only whether
a nonblank key exists; they never print the value. Restart the server after
changing the file. A loaded key has not been validated with Google yet.

The key is named `GEMINI_API_KEY`, with no `VITE_` prefix, and the file lives in the
server folder. It is not imported by the frontend. Missing keys return 503; configured keys are now used for real Gemini requests.
A configured key can still fail because of access permissions or usage limits.

## Lesson 4, part 3: Real Gemini replies

Before this step, `/api/chat` returned a fixed setup error. Now it reads JSON,
checks the history, calls Gemini, and returns `{ reply }`.

- `server/gemini.ts` converts `user` to Google's `user` role and `robot` to its
  `model` role. It sends the key through the `x-goog-api-key` header, extracts
  visible reply text, and turns upstream failures into safe, useful errors.
- `server/index.ts` checks the request content type and JSON, validates sender
  and text fields, and limits body size and message count before contacting Google.
- `src/services/chatApi.ts` now reads server error messages instead of replacing
  every failure with one generic message.
- `src/App.tsx` no longer displays the old setup-pending text.
- `tsconfig.server.json` permits `.ts` extensions so Node can resolve the server
  module directly while stripping TypeScript syntax.
- `server/gemini.test.ts` tests history conversion, thought filtering, missing
  keys, quota errors, empty responses, and timeouts without contacting Google.

The flow is: input → hook → frontend service → server → Gemini → server → hook
→ updated conversation. The key never enters this frontend flow.

Restart `npm run server` after the code change, keep `npm run dev` running in a
second terminal, and send a short message. Gemini requests time out after 45
seconds so the composer can recover. Conversations are still held in memory.

Reference: [Google's generateContent API](https://ai.google.dev/api/generate-content).
The default model is [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/pricing).

## Next steps

Once live replies work, add saved conversations and improve response formatting.
Deployment will need its own server routing; Vite's proxy only handles development.
