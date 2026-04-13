import jwt from "jsonwebtoken";

// dùng tạo ra cùng lúc 2 loại token

const genneralAccesToken = async (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "3d" });
  const refreshToken = jwt.sign(payload, process.env.REFRESH_JWT_SECRET, {
    expiresIn: "365d",
  });
  
  return {
    accessToken,
    refreshToken
  };
};

const genneralRefreshToken = async (payload) => {
  return jwt.sign(payload, process.env.REFRESH_JWT_SECRET, {
    expiresIn: "365d",
  });
};

export { genneralAccesToken, genneralRefreshToken };
