# Richardson Maturity Model (RMM) API Evaluation

This document evaluates the Task Management REST API built in Practical 4 against the four levels of the **Richardson Maturity Model (RMM)**.

---

## 1. RMM Evaluation Table

| Level | Criterion | Does our API satisfy this? | Evidence / Justification |
| :---: | :--- | :---: | :--- |
| **0** | **The Swamp of POX**<br>Uses HTTP simply as a transport mechanism for remote calls. Typically has a single URI endpoint and only uses the `POST` method. | **Yes** | *Exceeded.* Level 0 is the starting point. Our API does not use a single tunnel URI; it maps specific resources to specific HTTP verbs. |
| **1** | **Resources**<br>Introduces individual URIs for individual resources rather than tunneling everything through a single endpoint. | **Yes** | Our API has dedicated URI endpoints for individual resource scopes:<br>- Collection: `/tasks`<br>- Item: `/tasks/:id` |
| **2** | **HTTP Verbs & Status Codes**<br>Uses correct HTTP verbs (GET, POST, PUT, DELETE) and appropriate, meaningful HTTP status codes for responses. | **Yes** | Every endpoint complies with standard CRUD specifications:<br>- `GET /tasks` -> Retrieves task collection (`200 OK`) or `404 Not Found`<br>- `POST /tasks` -> Creates a task (`201 Created`) or `400 Bad Request`<br>- `PUT /tasks/:id` -> Updates a task (`200 OK`) or `400`/`404`<br>- `DELETE /tasks/:id` -> Removes a task (`200 OK`) or `404 Not Found`<br>- Invalid body types return `415 Unsupported Media Type`<br>- General failures trigger `500 Internal Server Error` |
| **3** | **Hypermedia Controls (HATEOAS)**<br>Responses include hypermedia links (`_links`) describing available state transitions and actions. | **No** | *Currently at Level 2.* Our API returns raw JSON resources (e.g., ID, title, description, completed) but does not dynamically inject transition link states into the response bodies. |

---

## 2. HATEOAS Awareness (Targeting Level 3)

If we were to upgrade our Task Management API to **Level 3 (HATEOAS)**, we would modify the response payloads to include a `_links` object mapping actions the client can perform on that specific task resource without hardcoding URLs.

### Target Response Payload Example

When fetching a task with ID `123` via `GET /tasks/123`, the server would return:

```json
{
  "id": 123,
  "title": "Build Express REST API",
  "description": "Implement CRUD endpoints and middlewares",
  "completed": false,
  "_links": {
    "self": {
      "href": "/tasks/123",
      "method": "GET",
      "description": "Retrieve task details"
    },
    "update": {
      "href": "/tasks/123",
      "method": "PUT",
      "description": "Modify task details or toggle completion status"
    },
    "delete": {
      "href": "/tasks/123",
      "method": "DELETE",
      "description": "Permanently remove task from the database"
    },
    "collection": {
      "href": "/tasks",
      "method": "GET",
      "description": "Retrieve the complete list of tasks"
    }
  }
}
```

---

## 3. Why Most Production APIs Stop at Level 2

While Level 3 (HATEOAS) provides an elegant architectural concept where clients navigate services dynamically like a web browser, the vast majority of real-world production APIs stop at **Level 2**. The reasons for this include:

1. **Payload and Bandwidth Overhead**: Injecting metadata links for every resource significantly increases JSON payload size. When fetching large arrays of items (e.g., thousands of database records), this overhead degrades API throughput.
2. **Client-Side Coupling Realities**: Real-world frontend clients are rarely built to dynamically discover routes on the fly. Frontend developers write code based on static API documentations (e.g., OpenAPI, Swagger, or GraphQL schemas) to build type-safe SDK bindings, rendering dynamic links practically unused.
3. **Server Implementation Complexity**: Dynamically calculating states, permissions (e.g., "can this user see the delete link?"), and generating URLs for every response demands heavy server-side processing, adding CPU and latency overhead.
4. **Tooling & Schema Ecosystems**: The industry has standardized heavily on tooling built around Level 2 (OpenAPI/Swagger codegen, Postman collections) which do not natively support or require Level 3 link navigation models.
