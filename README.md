# Express.js RESTful API Assignment

This assignment focuses on building a RESTful API using Express.js, implementing proper routing, middleware, and error handling.

## Assignment Overview

You will:
1. Set up an Express.js server
2. Create RESTful API routes for a product resource
3. Implement custom middleware for logging, authentication, and validation
4. Add comprehensive error handling
5. Develop advanced features like filtering, pagination, and search

## Getting Started

1. Accept the GitHub Classroom assignment invitation
2. Clone your personal repository that was created by GitHub Classroom
3. Install dependencies:
   ```
   npm install
   ```
4. Run the server:
   ```
   npm start
   ```

## Files Included

- `Week2-Assignment.md`: Detailed assignment instructions
- `server.js`: Starter Express.js server file
- `.env.example`: Example environment variables file

## Requirements

- Node.js (v18 or higher)
- npm or yarn
- Postman, Insomnia, or curl for API testing

## API Endpoints

The API will have the following endpoints:

- `GET /api/products`: Get all products
- `GET /api/products/:id`: Get a specific product
- `POST /api/products`: Create a new product
- `PUT /api/products/:id`: Update a product
- `DELETE /api/products/:id`: Delete a product

## Submission

Your work will be automatically submitted when you push to your GitHub Classroom repository. Make sure to:

1. Complete all the required API endpoints
2. Implement the middleware and error handling
3. Document your API in the README.md
4. Include examples of requests and responses

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [RESTful API Design Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) 

# Product API Server 🛍️

A simple Express server for managing products with features like CRUD operations, filtering, pagination, custom middleware, and global error handling.

## 🚀 How to Run the Server

### Prerequisites

You need **Node.js** and **npm** (or yarn/pnpm) installed on your system.

### Setup Steps

1.  **Clone the repository** (if applicable):
    ```bash
    git clone <your-repository-url>
    cd <your-project-directory>
    ```

2.  **Install dependencies**:
    This project uses `express`, `body-parser`, and `uuid`.
    ```bash
    npm install express body-parser uuid
    ```

3.  **Set Environment Variables**:
    Create a file named **`.env`** in the root directory and copy the contents of **`.env.example`** into it. Configure the variables as needed.

    *Example `.env`:*
    ```
    PORT=5000
    API_KEY=your-secret-api-key
    ```

4.  **Start the server**:
    ```bash
    node server.js
    ```
    The server will start on the port specified in `.env` file (e.g., `http://localhost:3000`).

---

## 💻 API Endpoints Documentation

The base URL for the API is `http://localhost:<PORT>/api`. All requests to authenticated endpoints **must** include the header `X-API-KEY: your-secret-api-key`.

| Method | Endpoint | Description | Authentication | Body/Query Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Welcomes message. | No | None |
| `GET` | `/api/products` | Get all products with optional **filtering** and **pagination**. | Yes | **Query**: `category`, `page`, `limit` |
| `GET` | `/api/products/search` | Search products by **name**. | Yes | **Query**: `q` (search term) |
| `GET` | `/api/products/:id` | Get a specific product by its **ID**. | Yes | **Params**: `:id` |
| `POST` | `/api/products` | Create a new product. | Yes | **Body**: Product object |
| `PUT` | `/api/products/:id` | Update an existing product by its **ID**. | Yes | **Params**: `:id`. **Body**: Product object (full update) |
| `DELETE` | `/api/products/:id` | Delete a product by its **ID**. | Yes | **Params**: `:id` |
| `GET` | `/api/products/stats` | Get product count grouped by **category**. | Yes | None |

---

## 📝 Examples of Requests and Responses

The examples below use the API Key `your-secret-api-key`.

### 1. Create a Product (`POST /api/products`)

**Request:**