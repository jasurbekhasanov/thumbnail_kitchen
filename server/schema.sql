-- Thumbnail Kitchen sxemasi. Har ishga tushganda qayta bajariladi, shuning uchun hammasi IF NOT EXISTS.

-- Mini App orqali ro'yxatdan o'tganlar
CREATE TABLE IF NOT EXISTS users (
  tg_id         BIGINT PRIMARY KEY,
  username      TEXT,
  first_name    TEXT,
  last_name     TEXT,
  roles         TEXT[] NOT NULL DEFAULT '{}',   -- designer, youtuber
  interests     TEXT[] NOT NULL DEFAULT '{}',   -- feedback, inspiration, challenges
  tag           TEXT,                           -- guruhda qo'yilgan tag
  tag_error     TEXT,                           -- tag qo'yilmagan bo'lsa sababi
  registered_at TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chellenj va ligada qatnashadigan dizaynerlar.
-- "Muqova dizaynerman" deb ro'yxatdan o'tganlar avtomatik qo'shiladi; admin qo'lda ham qo'sha oladi.
CREATE TABLE IF NOT EXISTS designers (
  id         SERIAL PRIMARY KEY,
  tg_id      BIGINT UNIQUE REFERENCES users(tg_id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  short      TEXT NOT NULL,                     -- setkadagi 3 harfli nom
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin yuklagan muqovalar (siqilgan JPEG, bir necha yuz KB)
CREATE TABLE IF NOT EXISTS images (
  id         UUID PRIMARY KEY,
  mime       TEXT NOT NULL,
  data       BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Haftalik chellenjlar. date — natijalar e'lon qilingan kun. Faqat published=true ilovada ko'rinadi.
CREATE TABLE IF NOT EXISTS challenges (
  id         SERIAL PRIMARY KEY,
  no         INT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  date       DATE NOT NULL,
  published  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS results (
  challenge_id INT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  place        INT NOT NULL CHECK (place BETWEEN 1 AND 5),
  designer_id  INT NOT NULL REFERENCES designers(id),
  post_url     TEXT,
  image_id     UUID REFERENCES images(id),
  PRIMARY KEY (challenge_id, place),
  UNIQUE (challenge_id, designer_id)
);

-- Liga mavsumlari. Bir vaqtda bitta active mavsum.
CREATE TABLE IF NOT EXISTS seasons (
  id             SERIAL PRIMARY KEY,
  title          TEXT NOT NULL DEFAULT 'Chempionlar Ligasi',
  label          TEXT NOT NULL,                 -- "2026"
  start          DATE NOT NULL,                 -- 1-tur boshlanishi (dushanba)
  qualify        INT NOT NULL DEFAULT 16,
  qualify_rounds INT NOT NULL DEFAULT 12,
  tour_days      INT NOT NULL DEFAULT 7,
  submit_days    INT NOT NULL DEFAULT 7,
  break_days     INT NOT NULL DEFAULT 14,
  draw_days      INT NOT NULL DEFAULT 2,
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Yakkama-yakka janglar: r16 (8 ta), qf (4), sf (2), f (1). slot — setkadagi o'rni.
CREATE TABLE IF NOT EXISTS matches (
  id         SERIAL PRIMARY KEY,
  season_id  INT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  round      TEXT NOT NULL CHECK (round IN ('r16', 'qf', 'sf', 'f')),
  slot       INT NOT NULL,
  a          INT REFERENCES designers(id),
  b          INT REFERENCES designers(id),
  start      DATE NOT NULL,
  deadline   DATE NOT NULL,
  winner     INT REFERENCES designers(id),
  decided_at DATE,
  post_url   TEXT,
  UNIQUE (season_id, round, slot)
);

-- Sahna orti: Teletype maqolalariga kartochkalar
CREATE TABLE IF NOT EXISTS sahna_posts (
  id         SERIAL PRIMARY KEY,
  no         INT NOT NULL,
  designer   TEXT NOT NULL,
  descr      TEXT NOT NULL DEFAULT '',
  date       DATE NOT NULL,
  read_min   INT NOT NULL DEFAULT 3,
  url        TEXT NOT NULL UNIQUE,
  cover      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
