# Problem 6: Score Board API Architecture

## 1. Overview
The **Score Board API** is responsible for managing user scores, processing score-increasing actions, and providing the Top 10 leaderboard to the frontend in real-time. Since score manipulation is a high-risk activity, the system incorporates strict validation and anti-fraud measures.

## 2. Architecture Diagram

```mermaid
sequenceDiagram
    participant Client
    participant LoadBalancer
    participant API Gateway
    participant ScoreService
    participant Redis Cache
    participant Database

    Client->>LoadBalancer: POST /api/v1/scores/action {actionType, signature, timestamp}
    LoadBalancer->>API Gateway: Rate Limiting & Auth Check
    API Gateway->>ScoreService: Validate Signature & Token
    
    alt Invalid Signature or Expired
        ScoreService-->>Client: 401 Unauthorized / 403 Forbidden
    else Valid Request
        ScoreService->>Database: Verify User & Process Action (calculate score)
        Database-->>ScoreService: Success
        ScoreService->>Redis Cache: ZINCRBY scoreboard <score> <user_id>
        ScoreService-->>Client: 200 OK (New Score)
        
        %% Real-time update push
        ScoreService--)Client: WebSocket: Broadcast new Top 10 (if changed)
    end
```

## 3. Security & Anti-Fraud Measures

To prevent malicious users from artificially increasing their scores:

1. **Authentication:** All requests must include a valid JWT token.
2. **Request Signing:** The payload must be signed using a secret key (HMAC-SHA256) stored securely on both the client and server. The signature includes a `timestamp` and a `nonce` to prevent **replay attacks**. Requests older than a few minutes are rejected.
3. **Server-Side Validation:** The client does NOT send the *score amount*. The client only sends the *action performed*. The server determines how many points that action is worth.
4. **Rate Limiting:** Implement strict IP-based and User-based rate limiting via API Gateway/Redis to prevent spamming the action endpoint.

## 4. API Endpoints

### `GET /api/v1/scores/top`
- **Description:** Returns the top 10 users with the highest scores.
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      { "userId": "123", "username": "player1", "score": 9500 },
      ...
    ]
  }
  ```
- **Performance:** Served directly from a Redis Sorted Set (`ZREVRANGE scoreboard 0 9 WITHSCORES`) for O(1) read latency.

### `POST /api/v1/scores/action`
- **Description:** Dispatches an action to increase the user's score.
- **Headers:** `Authorization: Bearer <token>`, `X-Signature: <hmac>`, `X-Timestamp: <time>`
- **Request Body:**
  ```json
  {
    "actionType": "COMPLETED_LEVEL_1"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "newScore": 9600
  }
  ```

## 5. Execution Flow

1. **Client Action:** The user completes an action on the website.
2. **Signing:** The client generates a timestamp and signs the payload `{actionType}`.
3. **Dispatch:** The client sends the POST request to the API.
4. **Validation:** The server verifies the JWT, checks the timestamp to prevent replay, and verifies the HMAC signature.
5. **Processing:** The server looks up the points mapping for `COMPLETED_LEVEL_1` (e.g., +100 points).
6. **Persistence:** The server updates the persistent Database and increments the user's score in the Redis Sorted Set (`ZINCRBY`).
7. **Broadcast:** If the user enters the Top 10 or shifts rankings, a WebSocket event is broadcasted to all connected clients to update their scoreboards in real-time.

## 6. Possible Improvements / Known Limitations

- **Client-side HMAC secret is a weak trust boundary.** Anything shipped to the browser/app can be extracted, so a sufficiently motivated user can read the secret and forge a valid signature for actions they never performed. Signing mainly stops casual tampering and replay, not a determined attacker. A stronger approach: have the server independently verify that the action actually happened (e.g. validate game/session state it already tracks) instead of trusting a client-asserted `actionType` at all; where that isn't feasible, treat scores as *provisional* and run anomaly detection (rate of gain, implausible patterns) to flag accounts for review.
- **Idempotency on retries.** The nonce/timestamp check stops *replay* attacks, but a legitimate client retry after a dropped response (timeout, flaky network) would be rejected rather than safely deduplicated. Worth adding a client-generated idempotency key per action so a retried request returns the original result instead of an error.
- **Redis/DB consistency.** `ZINCRBY` on Redis and the Database write are not atomic across two systems; a crash between them leaves the sorted set and the source-of-truth DB out of sync. Run a periodic reconciliation job that recomputes the sorted set from the DB and alerts on drift, similar in spirit to the ledger-reconciliation pattern used for financial balances.
- **WebSocket broadcast fan-out.** Having `ScoreService` push directly to every connected client doesn't scale past one process/instance. Route broadcasts through a Pub/Sub layer (Redis Pub/Sub or a message broker) that a fleet of stateless WebSocket gateway nodes subscribe to, so `ScoreService` stays decoupled from however many clients are connected.
- **Tie-breaking.** `ZREVRANGE` on score alone doesn't define a stable order for users tied on score. Add a deterministic secondary sort key (e.g. earliest timestamp to reach that score) so the Top 10 doesn't reshuffle arbitrarily between reads.
