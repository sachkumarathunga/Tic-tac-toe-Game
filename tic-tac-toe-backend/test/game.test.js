describe("Game Endpoints", () => {
  before(async () => {
    await setupDatabase(); // Ensure tables exist
  });

  after(async () => {
    await teardownDatabase(); // Clean up after tests
  });

  it("should create a new game", async () => {
    const res = await chai.request(app).post("/api/game/create-game").send({
      username: "player1",
    });
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Game created.");
    expect(res.body.gameKey).to.be.a("string");
  });

  it("should enroll a player into the game", async () => {
    const gameRes = await chai.request(app).post("/api/game/create-game").send({
      username: "player1",
    });

    const res = await chai.request(app).post("/api/game/enroll-game").send({
      gameKey: gameRes.body.gameKey,
      username: "player2",
    });
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Enrollment successful.");
  });

  it("should make a move", async () => {
    const gameRes = await chai.request(app).post("/api/game/create-game").send({
      username: "player1",
    });

    await chai.request(app).post("/api/game/enroll-game").send({
      gameKey: gameRes.body.gameKey,
      username: "player2",
    });

    const res = await chai.request(app).post("/api/game/make-move").send({
      gameKey: gameRes.body.gameKey,
      username: "player1",
      index: 0,
    });
    expect(res.status).to.equal(200);
    expect(res.body.board).to.be.a("string");
  });
});
