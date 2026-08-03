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
('DEFAULT_JOCKEY_HIRE_FEE','500.00', N'Default hire fee paid by horse owner to jockey per accepted mount ($100 - $10,000)'),
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
(2, 'owner_jackson',   '123456', 'jackson@owners.com',   'ACTIVE', NULL, NULL, NULL, N'James Jackson',   60000.00, 60000.00),
(2, 'owner_miller',    '123456', 'miller@owners.com',    'ACTIVE', NULL, NULL, NULL, N'Robert Miller',    85000.00, 85000.00),
(2, 'owner_chen',      '123456', 'chen@owners.com',      'ACTIVE', NULL, NULL, NULL, N'Chen Wei',        120000.00, 120000.00),
(3, 'jockey_ryan',     '123456', 'ryan@jockeys.com',     'ACTIVE', 58.5, 45, 20,    N'Ryan Thompson',   15000.00, 15000.00),
(3, 'jockey_emma',     '123456', 'emma@jockeys.com',     'ACTIVE', 52.0, 20, 8,     N'Emma Clarke',      18500.00, 18500.00),
(3, 'jockey_carlos',   '123456', 'carlos@jockeys.com',   'ACTIVE', 55.3, 80, 35,    N'Carlos Rivera',    22000.00, 22000.00),
(3, 'jockey_naomi',    '123456', 'naomi@jockeys.com',    'ACTIVE', 53.7, 4,  1,     N'Naomi Watanabe',   12000.00, 12000.00),
(4, 'fan_oliver',      '123456', 'oliver@fans.com',      'ACTIVE', NULL, NULL, NULL, N'Oliver Bennett',    1000.00, 1000.00),
(5, 'referee_harris',  '123456', 'harris@referees.com',  'ACTIVE', NULL, NULL, NULL, N'Michael Harris',   10000.00, 10000.00),
(5, 'referee_scott',   '123456', 'scott@referees.com',   'ACTIVE', NULL, NULL, NULL, N'David Scott',      10000.00, 10000.00);
GO

INSERT INTO Season (name, start_date, end_date, status) VALUES
('2025-2026 Championship Season', '2025-09-01', '2026-06-30', 'ACTIVE'),
('2026-2027 Grand Prix Season',   '2026-09-01', '2027-06-30', 'ACTIVE');
GO

INSERT INTO SeasonClassRule (season_id, class_level, class_name, min_rating, max_rating, min_prize, max_prize) VALUES
(1, 'Class 1', 'Elite Championship',    95, NULL, 300000.00, 1000000.00),
(1, 'Class 2', 'Premium Group',         80, 94,   200000.00, 299999.00),
(1, 'Class 3', 'Advanced Tier',         60, 79,   100000.00, 199999.00),
(1, 'Class 4', 'Intermediate Level',    40, 59,   50000.00,  99999.00),
(1, 'Class 5', 'Entry Division',        0,  39,   20000.00,  49999.00),
(2, 'Class 1', 'Elite Championship',    95, NULL, 300000.00, 1000000.00),
(2, 'Class 2', 'Premium Group',         80, 94,   200000.00, 299999.00),
(2, 'Class 3', 'Advanced Tier',         60, 79,   100000.00, 199999.00),
(2, 'Class 4', 'Intermediate Level',    40, 59,   50000.00,  99999.00),
(2, 'Class 5', 'Entry Division',        0,  39,   20000.00,  49999.00);
GO

INSERT INTO RaceMeeting (season_id, name, start_date, venue, total_budget, ticket_price) VALUES
(1, 'Spring Grand Prix 2026',    '2026-03-15 08:00:00', 'Sha Tin Racecourse', 800000.00, 50.00),
(2, 'Spring Gold Cup Day',       '2026-08-15 13:00:00', 'Royal Ascot Arena',  1200000.00, 100.00);
GO

INSERT INTO JockeyRaceMeetingRegistration (race_meeting_id, jockey_id, status) VALUES
(2, 5, 'APPROVED'), (2, 6, 'APPROVED'), (2, 7, 'APPROVED'), (2, 8, 'APPROVED');
GO

INSERT INTO OwnerRaceMeetingRegistration (race_meeting_id, owner_id, status) VALUES
(2, 2, 'APPROVED'), (2, 3, 'APPROVED'), (2, 4, 'APPROVED');
GO

INSERT INTO Race (race_meeting_id, start_time, registration_start_time, registration_end_time, status, class_level, min_rating, max_rating, distance_meters, track_type, purse, max_entries, first_place_prize, second_place_prize, third_place_prize, stream_mode) VALUES
(1, '2026-03-15 10:00:00', '2026-03-01 08:00:00', '2026-03-10 18:00:00', 'OFFICIAL',          'Class 3', 60,  79,   1200, 'Turf', 150000.00, 14, 75000.00, 45000.00, 30000.00, 'YOUTUBE'),
(1, '2026-03-15 14:00:00', '2026-03-01 08:00:00', '2026-03-10 18:00:00', 'OFFICIAL',          'Class 4', 40,  59,   1000, 'Dirt', 80000.00,  14, 40000.00, 24000.00, 16000.00, 'YOUTUBE'),
(2, '2026-08-15 14:30:00', '2026-08-01 08:00:00', '2026-08-12 18:00:00', 'DECLARATION_OPEN',  'Class 2', 80,  94,   1200, 'Turf', 250000.00, 12, 125000.00, 75000.00, 50000.00, 'YOUTUBE'),
(2, '2026-08-15 15:30:00', '2026-08-01 08:00:00', '2026-08-12 18:00:00', 'SCHEDULED',         'Class 1', 95,  NULL, 2000, 'Turf', 800000.00, 14, 400000.00, 240000.00, 160000.00, 'YOUTUBE');
GO

INSERT INTO Horse (owner_id, name, breed, sex, date_of_birth, status, current_rating, total_races, total_wins) VALUES
(2, 'Thunder King', 'Thoroughbred', 'Gelding', '2018-04-10', 'ACTIVE',  88, 15, 6),
(2, 'Silver Arrow',  'Arabian',      'Horse',   '2019-07-22', 'ACTIVE',  75, 10, 2),
(3, 'Storm Runner',  'Quarter Horse','Gelding', '2017-11-05', 'ACTIVE',  82, 12, 4),
(3, 'Dark Phantom',  'Thoroughbred', 'Mare',    '2020-02-18', 'INJURED', 65, 8,  1),
(4, 'Golden Flash',  'Akhal-Teke',   'Mare',    '2018-09-30', 'ACTIVE',  91, 18, 8),
(4, 'Iron Blaze',    'Hanoverian',   'Colt',    '2019-03-14', 'ACTIVE',  78, 14, 3);
GO

INSERT INTO HorseRaceMeetingRegistration (race_meeting_id, horse_id, status) VALUES
(2, 1, 'APPROVED'), (2, 2, 'APPROVED'), (2, 3, 'APPROVED'), (2, 5, 'APPROVED'), (2, 6, 'APPROVED');
GO

INSERT INTO RaceInvitation (race_id, horse_id, owner_id, jockey_id, status, payout_status, hire_fee) VALUES
(1, 1, 2, 5, 'ACCEPTED', 'PAID', 500.00), (1, 3, 3, 7, 'ACCEPTED', 'PAID', 500.00), (1, 5, 4, 6, 'ACCEPTED', 'PAID', 500.00),
(2, 2, 2, 5, 'ACCEPTED', 'HELD', 500.00), (2, 6, 4, 8, 'ACCEPTED', 'HELD', 500.00),
(3, 1, 2, 5, 'PENDING',  'PENDING', 500.00),  (3, 5, 4, 6, 'PENDING',  'PENDING', 500.00);
GO

INSERT INTO RaceEntry (race_id, horse_id, jockey_id, gate_number, status, final_position, finish_time, prize_money, carried_weight, rating_adjustment) VALUES
(1, 1, 5, 1, 'FINISHED', 1, '1:48.32', 84000.00, 60.00,  6), 
(1, 3, 7, 2, 'FINISHED', 2, '1:49.10', 31500.00, 57.50,  3), 
(1, 5, 6, 3, 'FINISHED', 3, '1:49.55', 17250.00, 55.00,  1), 
(2, 2, 5, 1, 'FINISHED', 1, '1:50.22', 44800.00, 60.00,  6), 
(2, 6, 8, 2, 'FINISHED', 2, '1:51.00', 16800.00, 56.20,  3),
(3, 1, 5, 1, 'APPROVED', NULL, NULL, 0.00, 58.00, 0),
(3, 3, 7, 2, 'APPROVED', NULL, NULL, 0.00, 56.00, 0),
(3, 5, 6, 3, 'APPROVED', NULL, NULL, 0.00, 55.00, 0),
(4, 2, 5, 1, 'APPROVED', NULL, NULL, 0.00, 58.50, 0),
(4, 6, 8, 2, 'APPROVED', NULL, NULL, 0.00, 55.50, 0);  
GO

INSERT INTO RaceReferee (race_id, referee_id) VALUES
(1, 10), (1, 11), (2, 10), (3, 11);
GO

INSERT INTO Violation (race_id, horse_id, jockey_id, referee_id, description, penalty) VALUES
(1, 3, 7, 10, 'Jockey cut off lane at turn 2', 'Fine $500');
GO

PRINT 'HorseRacingDB created successfully with 100% complete schema & updated balances.';
GO
