const request = require("supertest");
const app = require("../../app");

describe("Video platform routes", () => {
  test("GET /api/videos/catalog is public", async () => {
    const res = await request(app).get("/api/videos/catalog");
    expect(res.statusCode).toBe(200);
    expect(res.body.genres.length).toBeGreaterThan(0);
    expect(res.body.age_ratings).toContain("PG");
  });

  test("GET /api/videos is public", async () => {
    const res = await request(app).get("/api/videos");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("videos");
  });

  test("GET /api/videos/:id is public", async () => {
    const res = await request(app).get("/api/videos/1");
    expect([200, 404, 500]).toContain(res.statusCode);
    expect(res.statusCode).not.toBe(401);
  });

  test("POST /api/videos requires auth", async () => {
    const res = await request(app).post("/api/videos");
    expect(res.statusCode).toBe(401);
  });

  test("DELETE /api/videos/:id requires auth", async () => {
    const res = await request(app).delete("/api/videos/1");
    expect(res.statusCode).toBe(401);
  });

  test("POST /api/auth/creators is not public", async () => {
    const res = await request(app).post("/api/auth/creators").send({
      email: "x@y.com",
      username: "x",
      password: "Password1",
      fullName: "X",
    });
    expect(res.statusCode).toBe(403);
  });
});
