jest.mock("../../../models", () => ({
  User: { findOne: jest.fn() },
  Video: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  Comment: { create: jest.fn() },
  Rating: { findOne: jest.fn(), create: jest.fn(), findAll: jest.fn() },
}));

jest.mock("../../../config/cache", () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn(),
  cacheDelPrefix: jest.fn(),
}));

jest.mock("../../../config/storage", () => ({
  publicUrlFor: jest.fn(async (value) =>
    String(value).startsWith("http") ? value : `/media/${value}`
  ),
}));

jest.mock("../../../services/azureStorageService", () => ({
  uploadBlob: jest.fn(),
  deleteBlob: jest.fn(),
}));

jest.mock("../../../config/media", () => ({
  moderateMetadata: jest.fn(() => ({ status: "approved" })),
  transcodeIfPossible: jest.fn(() => ({
    outputPath: "/tmp/in.mp4",
    thumbnailPath: null,
    durationSeconds: null,
    status: "skipped",
  })),
}));

const { Video, Comment, Rating } = require("../../../models");
const { cacheGet } = require("../../../config/cache");
const { listVideos, addComment, rateVideo, getCatalog } = require("../../../controllers/videoController");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

describe("getCatalog", () => {
  test("returns genres and age ratings", () => {
    const res = mockRes();
    getCatalog({}, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        genres: expect.any(Array),
        age_ratings: expect.any(Array),
      })
    );
  });
});

describe("listVideos", () => {
  test("returns cached payload when present", async () => {
    cacheGet.mockResolvedValue({ success: true, videos: [{ id: 1 }] });
    const res = mockRes();
    await listVideos({ query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ videos: [{ id: 1 }] })
    );
  });

  test("returns paginated videos on cache miss", async () => {
    cacheGet.mockResolvedValue(null);
    Video.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [
        {
          toJSON: () => ({
            id: 1,
            title: "Demo",
            video_url: "clip.mp4",
            ratings: [{ score: 5 }],
          }),
        },
      ],
    });
    const res = mockRes();
    await listVideos({ query: { page: "1", limit: "12" } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        pagination: expect.objectContaining({ total: 1 }),
      })
    );
  });
});

describe("addComment", () => {
  test("returns 400 when comment missing", async () => {
    const res = mockRes();
    await addComment({ body: {}, params: { id: 1 }, user: { id: 2 } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("creates a comment", async () => {
    Video.findByPk.mockResolvedValue({ id: 1 });
    Comment.create.mockResolvedValue({ id: 9, comment: "fire" });
    const res = mockRes();
    await addComment(
      { body: { comment: "fire" }, params: { id: 1 }, user: { id: 2 } },
      res
    );
    expect(Comment.create).toHaveBeenCalledWith({
      comment: "fire",
      video_id: 1,
      user_id: 2,
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("rateVideo", () => {
  test("rejects invalid scores", async () => {
    const res = mockRes();
    await rateVideo(
      { body: { score: 9 }, params: { id: 1 }, user: { id: 2 } },
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("creates a rating", async () => {
    Video.findByPk.mockResolvedValue({ id: 1 });
    Rating.findOne.mockResolvedValue(null);
    Rating.create.mockResolvedValue({ score: 4 });
    Rating.findAll.mockResolvedValue([{ average: 4, count: 1 }]);
    const res = mockRes();
    await rateVideo(
      { body: { score: 4 }, params: { id: 1 }, user: { id: 2 } },
      res
    );
    expect(Rating.create).toHaveBeenCalledWith({
      user_id: 2,
      video_id: 1,
      score: 4,
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
