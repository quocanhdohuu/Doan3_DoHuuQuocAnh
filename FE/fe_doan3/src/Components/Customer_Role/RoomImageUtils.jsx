const LOCAL_IMAGE_BASE_URL = "http://localhost:3000/local-images/";

const getFileNameFromPath = (value = "") => {
  const normalized = String(value || "").trim().replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : "";
};

const buildLocalImageUrl = (fileName = "") => {
  const cleanName = String(fileName || "").trim();
  if (!cleanName) return "";
  return `${LOCAL_IMAGE_BASE_URL}${encodeURIComponent(cleanName)}`;
};

export const DEFAULT_ROOM_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 700'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='#dbeafe'/><stop offset='100%' stop-color='#e5e7eb'/></linearGradient></defs><rect width='1200' height='700' fill='url(#g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='58' fill='#64748b'>No Room Image</text></svg>",
)}`;

export const normalizeRoomImageUrl = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw) || /^data:image\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith("/local-images/")) {
    return `http://localhost:3000${raw}`;
  }

  if (raw.startsWith("local-images/")) {
    return `http://localhost:3000/${raw}`;
  }

  const localSegment = raw.match(/local-images[\\/](.+)$/i);
  if (localSegment?.[1]) {
    return buildLocalImageUrl(getFileNameFromPath(localSegment[1]));
  }

  const fileName = getFileNameFromPath(raw);
  return fileName ? buildLocalImageUrl(fileName) : "";
};

export const getRoomImageFromApiItem = (item) =>
  normalizeRoomImageUrl(
    item?.ImageUrl ?? item?.ImageURL ?? item?.Image ?? item?.thumbnail ?? "",
  );

