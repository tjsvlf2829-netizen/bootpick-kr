-- 리뷰 1건 = 모델 하나 + 브라우저 하나. 같은 브라우저가 다시 쓰면 덮어씀
CREATE TABLE IF NOT EXISTS reviews (
  model   TEXT    NOT NULL,
  vid     TEXT    NOT NULL,
  width   INTEGER NOT NULL,
  light   INTEGER NOT NULL,
  cushion INTEGER NOT NULL,
  touch   INTEGER NOT NULL,
  dur     INTEGER NOT NULL,
  c       TEXT    NOT NULL DEFAULT '',
  t       INTEGER NOT NULL,
  iph     TEXT    NOT NULL,
  fit     INTEGER,            -- 사이즈 체감: -1 작게 나옴, 0 맞음, 1 크게 나옴 (선택)
  PRIMARY KEY (model, vid)
);
CREATE INDEX IF NOT EXISTS reviews_iph_t ON reviews (iph, t);
CREATE INDEX IF NOT EXISTS reviews_t ON reviews (t);
