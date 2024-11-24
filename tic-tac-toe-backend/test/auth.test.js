import chai from "chai";
import chaiHttp from "chai-http";
import app from "../app.js"; // Ensure app.js uses `export default app`

const { expect } = chai; // Extract `expect` from chai
chai.use(chaiHttp); // Use chai-http for API testing

describe("Auth Endpoints", () => {
  it("should register a new user", async () => {
    const res = await chai.request(app).post("/api/auth/register").send({
      username: "testuser",
      password: "password123",
    });
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Registration successful.");
  });

  it("should login an existing user", async () => {
    const res = await chai.request(app).post("/api/auth/login").send({
      username: "testuser",
      password: "password123",
    });
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Login successful.");
  });
});
