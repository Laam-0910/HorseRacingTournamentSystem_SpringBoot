-- ==========================================
-- HORSE RACING DATABASE - Microsoft SQL Server
-- Complete Full Production Schema & Initial Seed Data
-- Default password for all sample accounts: 123456
-- ==========================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'HorseRacingDB')
BEGIN
    ALTER DATABASE HorseRacingDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE HorseRacingDB;
END
GO

CREATE DATABASE HorseRacingDB;
GO

USE HorseRacingDB;
GO

-- ==========================================
-- TABLE CREATION
-- ==========================================

CREATE TABLE SystemConfig (
    config_key      VARCHAR(50) PRIMARY KEY,
    config_value    VARCHAR(255) NOT NULL,
    description     NVARCHAR(255) NULL,
    updated_at      DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE Role (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    role_name   VARCHAR(50) NOT NULL  -- Admin, Owner, Jockey, Spectator, Referee
);
GO

CREATE TABLE [User] (
    id                          INT IDENTITY(1,1) PRIMARY KEY,
    role_id                     INT NOT NULL,
    username                    VARCHAR(100) NOT NULL UNIQUE,    -- Login Account
    password_hash               VARCHAR(255) NOT NULL,           -- Default password: 123456
    email                       VARCHAR(150) NOT NULL UNIQUE,
    status                      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, INACTIVE
    weight                      DECIMAL(5,2) NULL,              -- Jockey weight in kg (for handicap calculations)
    experience_years            INT NULL DEFAULT 0,
    win_rate                    FLOAT NULL DEFAULT 0.0,
    total_races_participated    INT NULL DEFAULT 0,             -- Career Stats: Total races entered
    total_top3_finishes         INT NULL DEFAULT 0,             -- Career Stats: Total top-3 finishes
    require_otp                 BIT NOT NULL DEFAULT 0,
    is_2fa_enabled              BIT NOT NULL DEFAULT 0,
    two_factor_secret           VARCHAR(255) NULL,
    two_factor_temp_secret      VARCHAR(255) NULL,
    avatar                      VARCHAR(MAX) NULL,              -- Profile avatar stored in Base64
    full_name                   NVARCHAR(100) NULL,             -- Display Name
    biography                   NVARCHAR(MAX) NULL,             -- Personal biography / profile introduction
    wallet_balance              DECIMAL(18,2) NOT NULL DEFAULT 0.00, -- User wallet balance
    balance                     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT CK_User_Status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
GO

CREATE TABLE Season (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,              -- e.g.: '2026-2027 Grand Prix Season'
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, CLOSED
    CONSTRAINT CK_Season_Status CHECK (status IN ('ACTIVE', 'CLOSED'))
);
GO

CREATE TABLE SeasonClassRule (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    season_id       INT NOT NULL,
    class_level     VARCHAR(50) NOT NULL,       -- 'Class 1', 'Class 2'...
    class_name      VARCHAR(100) NULL,          
    min_rating      INT NULL,
    max_rating      INT NULL,
    min_prize       DECIMAL(18,2) NULL,
    max_prize       DECIMAL(18,2) NULL
);
GO

CREATE TABLE RaceMeeting (
    id                      INT IDENTITY(1,1) PRIMARY KEY,
    season_id               INT NOT NULL,                   
    name                    VARCHAR(200) NOT NULL,          -- e.g.: Spring Gold Cup Day
    start_date              DATETIME NOT NULL,
    venue                   VARCHAR(150) NOT NULL,          -- Racecourse Venue
    total_budget            DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    ticket_price            DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    ticket_settled          BIT NOT NULL DEFAULT 0,
    status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, ENDED, CANCELLED
    last_allocated_budget   DECIMAL(18,2) NULL
);
GO

-- Jockey Race Meeting Registration
CREATE TABLE JockeyRaceMeetingRegistration (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    race_meeting_id INT NOT NULL,
    jockey_id       INT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
    registered_at   DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_Jockey_Meeting UNIQUE (race_meeting_id, jockey_id),
    CONSTRAINT CK_JRMR_Status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
);
GO

-- Horse Owner Race Meeting Registration
CREATE TABLE OwnerRaceMeetingRegistration (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    race_meeting_id INT NOT NULL,
    owner_id        INT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
    registered_at   DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_Owner_Meeting UNIQUE (race_meeting_id, owner_id),
    CONSTRAINT CK_ORMR_Status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
);
GO

-- Horse Race Meeting Registration
CREATE TABLE HorseRaceMeetingRegistration (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    race_meeting_id INT NOT NULL,
    horse_id        INT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
    registered_at   DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_Horse_Meeting UNIQUE (race_meeting_id, horse_id),
    CONSTRAINT CK_HRMR_Status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
);
GO

CREATE TABLE Race (
    id                      INT IDENTITY(1,1) PRIMARY KEY,
    race_meeting_id         INT NOT NULL,
    start_time              DATETIME NOT NULL,
    registration_start_time DATETIME NOT NULL,
    registration_end_time   DATETIME NOT NULL,
    status                  VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED', 
    class_level             VARCHAR(50) NULL,               
    min_rating              INT NULL,
    max_rating              INT NULL,
    distance_meters         INT NULL,
    track_type              VARCHAR(20) NULL,
    purse                   DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    min_entries             INT NOT NULL DEFAULT 3,
    max_entries             INT NOT NULL DEFAULT 14,
    steward_report          NVARCHAR(MAX) NULL,
    youtube_live_url        VARCHAR(500) NULL,
    stream_mode             VARCHAR(20) NOT NULL DEFAULT 'YOUTUBE',
    total_prize_pool        DECIMAL(18,2) NULL DEFAULT 0.00,
    first_place_prize       DECIMAL(18,2) NULL DEFAULT 0.00,
    second_place_prize      DECIMAL(18,2) NULL DEFAULT 0.00,
    third_place_prize       DECIMAL(18,2) NULL DEFAULT 0.00,
    CONSTRAINT CK_Race_Status CHECK (status IN ('SCHEDULED', 'DECLARATION_OPEN', 'DECLARATION_CLOSED', 'RACE_ASSIGNED', 'RUNNING', 'STEWARDS_INQUIRY', 'FINISHED', 'OFFICIAL', 'CANCELLED', 'RACE_EVENT_ENDED', 'STOPPED'))
);
GO

CREATE TABLE Horse (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    owner_id        INT NOT NULL,
    name            VARCHAR(150) NOT NULL,
    breed           VARCHAR(100) NULL,
    sex             VARCHAR(20) NULL,
    date_of_birth   DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    current_rating  INT NOT NULL DEFAULT 52,
    total_races     INT NOT NULL DEFAULT 0,
    total_wins      INT NOT NULL DEFAULT 0,
    avatar          VARCHAR(MAX) NULL,
    description     NVARCHAR(MAX) NULL
);
GO

CREATE TABLE RaceInvitation (
    id                      INT IDENTITY(1,1) PRIMARY KEY,
    race_id                 INT NOT NULL,
    horse_id                INT NOT NULL,
    owner_id                INT NOT NULL,
    jockey_id               INT NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, EXPIRED
    commission_amount       DECIMAL(12,2) NULL,
    commission_rate         DECIMAL(5,2) NULL,
    payout_status           VARCHAR(30) NULL DEFAULT 'HELD',
    hire_fee                DECIMAL(12,2) NULL DEFAULT 500.00,
    jockey_prize_percentage DECIMAL(5,2) NULL DEFAULT 20.00,
    jockey_share_percentage DECIMAL(5,2) NULL DEFAULT 10.00,
    CONSTRAINT CK_Invite_Status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'))
);
GO

CREATE TABLE RaceEntry (
    id                      INT IDENTITY(1,1) PRIMARY KEY,
    race_id                 INT NOT NULL,
    horse_id                INT NOT NULL,
    jockey_id               INT NOT NULL,
    gate_number             INT NOT NULL,
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING_ADMIN', -- PENDING_ADMIN, APPROVED, RUNNING, FINISHED, DISQUALIFIED, REJECTED
    final_position          INT NULL,
    finish_time             VARCHAR(20) NULL,
    prize_money             DECIMAL(18,2) NULL DEFAULT 0,
    carried_weight          DECIMAL(5,2) NULL,
    rating_adjustment       INT NULL,
    handicap_weight         DECIMAL(5,2) NULL,
    jockey_prize_percentage DECIMAL(5,2) NULL DEFAULT 20.00,
    CONSTRAINT CK_RaceEntry_Status CHECK (status IN ('PENDING_ADMIN', 'APPROVED', 'RUNNING', 'FINISHED', 'DISQUALIFIED', 'REJECTED', 'STOPPED'))
);
GO

CREATE TABLE RaceReferee (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    race_id     INT NOT NULL,
    referee_id  INT NOT NULL
);
GO

CREATE TABLE Violation (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    race_id     INT NOT NULL,
    horse_id    INT NOT NULL,
    jockey_id   INT NOT NULL,
    referee_id  INT NOT NULL,
    description VARCHAR(500) NOT NULL,
    penalty     VARCHAR(200) NOT NULL,
    status      VARCHAR(30) NOT NULL DEFAULT 'PENDING'
);
GO

CREATE TABLE ChatMessage (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    race_id       INT NOT NULL,
    username      VARCHAR(100) NOT NULL,
    message_text  NVARCHAR(MAX) NOT NULL,
    sent_at       DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE notifications (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    user_id     INT NOT NULL,
    title       NVARCHAR(255) NULL,
    message     NVARCHAR(MAX) NOT NULL,
    is_read     BIT NOT NULL DEFAULT 0,
    created_at  DATETIME DEFAULT GETDATE(),
    read_at     DATETIME NULL
);
GO

CREATE TABLE LivestreamSubscription (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    user_id          INT NOT NULL,
    package_type     VARCHAR(30) NOT NULL, -- 'RACEMEETING' or 'SEASON'
    season_id        INT NULL,
    race_meeting_id  INT NULL,
    price_paid       DECIMAL(18,2) NOT NULL,
    discount_applied DECIMAL(18,2) NULL DEFAULT 0,
    purchase_time    DATETIME DEFAULT GETDATE(),
    expires_at       DATETIME NULL,
    payment_method   VARCHAR(50) NULL DEFAULT 'VIETQR'
);
GO

CREATE TABLE HorseRetirementRequest (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    horse_id      INT NOT NULL,
    owner_id      INT NOT NULL,
    reason        NVARCHAR(MAX) NOT NULL,
    status        VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    admin_remarks NVARCHAR(MAX) NULL,
    created_at    DATETIME DEFAULT GETDATE(),
    processed_at  DATETIME NULL
);
GO

CREATE TABLE WalletTransaction (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    user_id          INT NOT NULL,
    amount           DECIMAL(18,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description      NVARCHAR(MAX) NULL,
    race_meeting_id  INT NULL,
    created_at       DATETIME DEFAULT GETDATE()
);
GO

-- ==========================================
-- FOREIGN KEY CONSTRAINTS
-- ==========================================

ALTER TABLE [User] ADD CONSTRAINT FK_User_Role FOREIGN KEY (role_id) REFERENCES Role(id);

ALTER TABLE SeasonClassRule ADD CONSTRAINT FK_ClassRule_Season FOREIGN KEY (season_id) REFERENCES Season(id);
ALTER TABLE RaceMeeting ADD CONSTRAINT FK_Meeting_Season FOREIGN KEY (season_id) REFERENCES Season(id);

ALTER TABLE Race ADD CONSTRAINT FK_Race_Meeting FOREIGN KEY (race_meeting_id) REFERENCES RaceMeeting(id);
ALTER TABLE Horse ADD CONSTRAINT FK_Horse_Owner FOREIGN KEY (owner_id) REFERENCES [User](id);

ALTER TABLE JockeyRaceMeetingRegistration ADD CONSTRAINT FK_JRMR_Meeting FOREIGN KEY (race_meeting_id) REFERENCES RaceMeeting(id);
ALTER TABLE JockeyRaceMeetingRegistration ADD CONSTRAINT FK_JRMR_Jockey FOREIGN KEY (jockey_id) REFERENCES [User](id);

ALTER TABLE OwnerRaceMeetingRegistration ADD CONSTRAINT FK_ORMR_Meeting FOREIGN KEY (race_meeting_id) REFERENCES RaceMeeting(id);
ALTER TABLE OwnerRaceMeetingRegistration ADD CONSTRAINT FK_ORMR_Owner FOREIGN KEY (owner_id) REFERENCES [User](id);

ALTER TABLE HorseRaceMeetingRegistration ADD CONSTRAINT FK_HRMR_Meeting FOREIGN KEY (race_meeting_id) REFERENCES RaceMeeting(id);
ALTER TABLE HorseRaceMeetingRegistration ADD CONSTRAINT FK_HRMR_Horse FOREIGN KEY (horse_id) REFERENCES Horse(id);

ALTER TABLE RaceInvitation ADD CONSTRAINT FK_Invite_Race   FOREIGN KEY (race_id)   REFERENCES Race(id);
ALTER TABLE RaceInvitation ADD CONSTRAINT FK_Invite_Horse  FOREIGN KEY (horse_id)  REFERENCES Horse(id);
ALTER TABLE RaceInvitation ADD CONSTRAINT FK_Invite_Owner  FOREIGN KEY (owner_id)  REFERENCES [User](id);
ALTER TABLE RaceInvitation ADD CONSTRAINT FK_Invite_Jockey FOREIGN KEY (jockey_id) REFERENCES [User](id);

ALTER TABLE RaceEntry ADD CONSTRAINT FK_Entry_Race   FOREIGN KEY (race_id)   REFERENCES Race(id);
ALTER TABLE RaceEntry ADD CONSTRAINT FK_Entry_Horse  FOREIGN KEY (horse_id)  REFERENCES Horse(id);
ALTER TABLE RaceEntry ADD CONSTRAINT FK_Entry_Jockey FOREIGN KEY (jockey_id) REFERENCES [User](id);

ALTER TABLE RaceReferee ADD CONSTRAINT FK_RaceRef_Race    FOREIGN KEY (race_id)    REFERENCES Race(id);
ALTER TABLE RaceReferee ADD CONSTRAINT FK_RaceRef_Referee FOREIGN KEY (referee_id) REFERENCES [User](id);

ALTER TABLE Violation ADD CONSTRAINT FK_Viol_Race    FOREIGN KEY (race_id)    REFERENCES Race(id);
ALTER TABLE Violation ADD CONSTRAINT FK_Viol_Horse   FOREIGN KEY (horse_id)   REFERENCES Horse(id);
ALTER TABLE Violation ADD CONSTRAINT FK_Viol_Jockey  FOREIGN KEY (jockey_id)  REFERENCES [User](id);
ALTER TABLE Violation ADD CONSTRAINT FK_Viol_Referee FOREIGN KEY (referee_id) REFERENCES [User](id);
ALTER TABLE ChatMessage ADD CONSTRAINT FK_Chat_Race   FOREIGN KEY (race_id)    REFERENCES Race(id) ON DELETE CASCADE;

ALTER TABLE notifications ADD CONSTRAINT FK_Notification_User FOREIGN KEY (user_id) REFERENCES [User](id) ON DELETE CASCADE;
ALTER TABLE HorseRetirementRequest ADD CONSTRAINT FK_Retire_Horse FOREIGN KEY (horse_id) REFERENCES Horse(id);
ALTER TABLE HorseRetirementRequest ADD CONSTRAINT FK_Retire_Owner FOREIGN KEY (owner_id) REFERENCES [User](id);
ALTER TABLE WalletTransaction ADD CONSTRAINT FK_WalletTx_Meeting FOREIGN KEY (race_meeting_id) REFERENCES RaceMeeting(id) ON DELETE SET NULL;
GO

-- ==========================================
-- INSERT SAMPLE DATA
-- ==========================================

INSERT INTO SystemConfig (config_key, config_value, description) VALUES
('MAX_TOP_WEIGHT',         '60.0', N'Maximum carried weight allowance (kg)'),
('MIN_BOTTOM_WEIGHT',      '52.0', N'Minimum carried weight allowance (kg)'),
('WEIGHT_PER_POINT',       '0.5',  N'Weight adjustment in kg per 1 point rating difference'),
('MAX_OVERWEIGHT_ALLOWED', '1.0',  N'Maximum allowed overweight allowance for Jockey (kg)'),
('SEX_ALLOWANCE',          '1.5',  N'Sex allowance for female horses (Fillies/Mares) (kg)'),
('DEFAULT_JOCKEY_HIRE_FEE','500000.00', N'Default hire fee paid by horse owner to jockey per accepted mount (10,000 VND - 10,000,000 VND)'),
('MIN_TICKET_PRICE',      '10000.00', N'Minimum allowed ticket price for a Race Meeting in VND'),
('MAX_TICKET_PRICE',      '5000000.00', N'Maximum allowed ticket price for a Race Meeting in VND'),
('PRIZE_SHARE_1ST',       '50.00', N'Percentage of purse allocated to 1st place'),
('PRIZE_SHARE_2ND',       '30.00', N'Percentage of purse allocated to 2nd place'),
('PRIZE_SHARE_3RD',       '20.00', N'Percentage of purse allocated to 3rd place'),
('PAYMENT_GATEWAY_MODE',  'MOCK', N'Payment Gateway Mode: MOCK (Virtual Money Demo) or LIVE (Real Money Gateway)'),
('PAYOS_CLIENT_ID',       'NOT_SET', N'PayOS Payment Gateway Client ID (for LIVE real money mode)'),
('PAYOS_API_KEY',          'NOT_SET', N'PayOS Payment Gateway API Key (for LIVE real money mode)'),
('PAYOS_CHECKSUM_KEY',     'NOT_SET', N'PayOS Payment Gateway Checksum Key (for LIVE real money mode)');
GO

INSERT INTO Role (role_name) VALUES ('Admin'), ('Owner'), ('Jockey'), ('Spectator'), ('Referee');
GO

-- All accounts have default password: 123456
INSERT INTO [User] (role_id, username, password_hash, email, status, weight, total_races_participated, total_top3_finishes, full_name, wallet_balance, balance) VALUES
(1, 'admin_root',      '123456', 'admin@horserace.com',  'ACTIVE', NULL, NULL, NULL, N'Administrator', 5000000000.00, 5000000000.00),
(2, 'owner_jackson',   '123456', 'jackson@owners.com',   'ACTIVE', NULL, NULL, NULL, N'James Jackson',   60000000.00, 60000000.00),
(2, 'owner_miller',    '123456', 'miller@owners.com',    'ACTIVE', NULL, NULL, NULL, N'Robert Miller',    85000000.00, 85000000.00),
(2, 'owner_chen',      '123456', 'chen@owners.com',      'ACTIVE', NULL, NULL, NULL, N'Chen Wei',        120000000.00, 120000000.00),
(2, 'owner_david',     '123456', 'david@owners.com',     'ACTIVE', NULL, NULL, NULL, N'David Harrison',   95000000.00, 95000000.00),
(3, 'jockey_ryan',     '123456', 'ryan@jockeys.com',     'ACTIVE', 58.5, 45, 20,    N'Ryan Thompson',   15000000.00, 15000000.00),
(3, 'jockey_emma',     '123456', 'emma@jockeys.com',     'ACTIVE', 52.0, 20, 8,     N'Emma Clarke',      18500000.00, 18500000.00),
(3, 'jockey_carlos',   '123456', 'carlos@jockeys.com',   'ACTIVE', 55.3, 80, 35,    N'Carlos Rivera',    22000000.00, 22000000.00),
(3, 'jockey_naomi',    '123456', 'naomi@jockeys.com',    'ACTIVE', 53.7, 4,  1,     N'Naomi Watanabe',   12000000.00, 12000000.00),
(4, 'fan_oliver',      '123456', 'oliver@fans.com',      'ACTIVE', NULL, NULL, NULL, N'Oliver Bennett',    1000000.00, 1000000.00),
(4, 'fan_sophia',      '123456', 'sophia@fans.com',      'ACTIVE', NULL, NULL, NULL, N'Sophia Taylor',     5000000.00, 5000000.00),
(4, 'fan_lucas',       '123456', 'lucas@fans.com',       'ACTIVE', NULL, NULL, NULL, N'Lucas Martinez',    3500000.00, 3500000.00),
(5, 'referee_harris',  '123456', 'harris@referees.com',  'ACTIVE', NULL, NULL, NULL, N'Michael Harris',   10000000.00, 10000000.00),
(5, 'referee_scott',   '123456', 'scott@referees.com',   'ACTIVE', NULL, NULL, NULL, N'David Scott',      10000000.00, 10000000.00);
INSERT INTO Horse (owner_id, name, breed, sex, date_of_birth, status, current_rating, total_races, total_wins) VALUES
(2, 'Thunder King', 'Thoroughbred', 'Gelding', '2018-04-10', 'ACTIVE',  88, 0, 0),
(2, 'Silver Arrow',  'Arabian',      'Horse',   '2019-07-22', 'ACTIVE',  75, 0, 0),
(3, 'Storm Runner',  'Quarter Horse','Gelding', '2017-11-05', 'ACTIVE',  82, 0, 0),
(3, 'Dark Phantom',  'Thoroughbred', 'Mare',    '2020-02-18', 'ACTIVE',  65, 0, 0),
(4, 'Golden Flash',  'Akhal-Teke',   'Mare',    '2018-09-30', 'ACTIVE',  91, 0, 0),
(4, 'Iron Blaze',    'Hanoverian',   'Colt',    '2019-03-14', 'ACTIVE',  78, 0, 0);
GO

-- ============================================================
-- WithdrawalRequest Table
-- Lưu trữ yêu cầu rút tiền của người dùng (Owner/Jockey/Spectator)
-- Flow: User tạo request (PENDING) → Admin duyệt + chuyển khoản thật
--       → Admin mark PROCESSED → Hệ thống trừ ví user
-- Tiền KHÔNG bị trừ ngay khi tạo request, chỉ trừ khi PROCESSED
-- ============================================================
CREATE TABLE WithdrawalRequest (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    user_id          INT NOT NULL,
    amount           DECIMAL(18,2) NOT NULL,
    bank_name        NVARCHAR(100) NULL,
    account_number   NVARCHAR(50)  NULL,
    account_holder   NVARCHAR(200) NULL,
    notes            NVARCHAR(500) NULL,

    -- PENDING   = Chờ Admin xử lý (ví chưa bị trừ)
    -- PROCESSED = Admin đã chuyển khoản + hệ thống đã trừ ví
    -- REJECTED  = Admin từ chối (ví không bị trừ)
    status           VARCHAR(20)   NOT NULL DEFAULT 'PENDING',

    processed_note   NVARCHAR(500) NULL,    -- Ghi chú của Admin khi duyệt/từ chối
    processed_by     INT           NULL,    -- ID Admin đã xử lý
    created_at       DATETIME      NOT NULL DEFAULT GETDATE(),
    processed_at     DATETIME      NULL
);
GO

-- Index tăng tốc query theo status và user_id
CREATE INDEX IX_WithdrawalRequest_Status   ON WithdrawalRequest(status);
CREATE INDEX IX_WithdrawalRequest_UserId   ON WithdrawalRequest(user_id);
CREATE INDEX IX_WithdrawalRequest_Created  ON WithdrawalRequest(created_at DESC);
GO

-- FK: user_id → [User].id
ALTER TABLE WithdrawalRequest
    ADD CONSTRAINT FK_WithdrawalRequest_User
    FOREIGN KEY (user_id) REFERENCES [User](id) ON DELETE CASCADE;
GO

-- ============================================================
-- SystemConfig — Thêm MIN_WITHDRAWAL_AMOUNT nếu chưa có
-- Giá trị mặc định: 50,000 VND (số nguyên, không có thập phân)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM SystemConfig WHERE config_key = 'MIN_WITHDRAWAL_AMOUNT')
BEGIN
    INSERT INTO SystemConfig (config_key, config_value, description)
    VALUES (
        'MIN_WITHDRAWAL_AMOUNT',
        '50000',
        'Minimum withdrawal amount for users (Horse Owner / Jockey / Spectator) in VND. Default: 50000'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM SystemConfig WHERE config_key = 'AUTO_DISBURSEMENT_ENABLED')
BEGIN
    INSERT INTO SystemConfig (config_key, config_value, description)
    VALUES (
        'AUTO_DISBURSEMENT_ENABLED',
        'TRUE',
        'Auto Disbursement Payout: TRUE (Instant API auto payout) or FALSE (Manual Admin approval)'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM SystemConfig WHERE config_key = 'PAYOS_PAYOUT_API_KEY')
BEGIN
    INSERT INTO SystemConfig (config_key, config_value, description)
    VALUES (
        'PAYOS_PAYOUT_API_KEY',
        '',
        'PayOS / Bank Payout API Key (for LIVE real money auto-disbursement)'
    );
END
GO

PRINT 'HorseRacingDB created successfully with 100% complete schema & updated balances.';
PRINT 'WithdrawalRequest table created. MIN_WITHDRAWAL_AMOUNT & AUTO_DISBURSEMENT_ENABLED configs seeded.';
GO
