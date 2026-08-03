-- ==========================================
-- HORSE RACING DATABASE - Microsoft SQL Server
-- Updated: Added full_name (NVARCHAR(100)), avatar (VARCHAR(MAX)) to [User] table
--          Added wallet_balance DECIMAL(18,2) DEFAULT 0.00 to [User] table
--          Added notifications table for persistent system notifications
--          Default password for all sample accounts: 123456
--          Added 'FINISHED' status to CK_Race_Status in Race table
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
    username                    VARCHAR(100) NOT NULL UNIQUE,    -- Login Account (CANNOT be changed)
    password_hash               VARCHAR(255) NOT NULL,           -- Default password: 123456
    email                       VARCHAR(150) NOT NULL UNIQUE,
    status                      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, INACTIVE
    weight                      DECIMAL(5,2) NULL,              -- Jockey weight in kg (for handicap calculations)
    total_races_participated    INT NULL DEFAULT 0,             -- Career Stats: Total races entered
    total_top3_finishes         INT NULL DEFAULT 0,             -- Career Stats: Total top-3 finishes
    require_otp                 BIT NOT NULL DEFAULT 0,
    avatar                      VARCHAR(MAX) NULL,              -- Profile avatar stored in Base64
    full_name                   NVARCHAR(100) NULL,             -- Display Name (CAN be changed)
    biography                   NVARCHAR(MAX) NULL,             -- Personal biography / profile introduction
    wallet_balance              DECIMAL(18,2) NOT NULL DEFAULT 0.00, -- User wallet balance for prize money & payouts
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
    id              INT IDENTITY(1,1) PRIMARY KEY,
    season_id       INT NOT NULL,                   
    name            VARCHAR(200) NOT NULL,          -- e.g.: Spring Gold Cup Day
    start_date      DATETIME NOT NULL,
    venue           VARCHAR(150) NOT NULL,          -- Racecourse Venue (e.g.: Royal Ascot Arena)
    total_budget    DECIMAL(18,2) NOT NULL DEFAULT 0.00
);
GO

-- Jockey Race Meeting Registration
CREATE TABLE JockeyRaceMeetingRegistration (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    race_meeting_id INT NOT NULL,
    jockey_id       INT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    registered_at   DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_Jockey_Meeting UNIQUE (race_meeting_id, jockey_id),
    CONSTRAINT CK_JRMR_Status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);
GO

-- Horse Owner Race Meeting Registration
CREATE TABLE OwnerRaceMeetingRegistration (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    race_meeting_id INT NOT NULL,
    owner_id        INT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    registered_at   DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_Owner_Meeting UNIQUE (race_meeting_id, owner_id),
    CONSTRAINT CK_ORMR_Status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);
GO

-- Horse Race Meeting Registration (Validates horse eligibility for venue)
CREATE TABLE HorseRaceMeetingRegistration (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    race_meeting_id INT NOT NULL,
    horse_id        INT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    registered_at   DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_Horse_Meeting UNIQUE (race_meeting_id, horse_id),
    CONSTRAINT CK_HRMR_Status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);
GO

CREATE TABLE Race (
    id                      INT IDENTITY(1,1) PRIMARY KEY,
    race_meeting_id         INT NOT NULL,
    start_time              DATETIME NOT NULL,
    registration_start_time DATETIME NOT NULL,         -- Registration Opening Time
    registration_end_time   DATETIME NOT NULL,         -- Registration Deadline
    status                  VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED', 
    class_level             VARCHAR(50) NULL,               
    min_rating              INT NULL,
    max_rating              INT NULL,
    distance_meters         INT NULL,
    track_type              VARCHAR(20) NULL,
    purse                   DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    min_entries             INT NOT NULL DEFAULT 3,
    max_entries             INT NOT NULL DEFAULT 14,
    steward_report          NVARCHAR(MAX) NULL,        -- Steward Official Report after race
    youtube_live_url        VARCHAR(500) NULL,          -- YouTube Livestream URL
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
    sex             VARCHAR(20) NULL,           -- Gelding, Colt, Horse, Filly, Mare
    date_of_birth   DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    current_rating  INT NOT NULL DEFAULT 52,
    total_races     INT NOT NULL DEFAULT 0,
    total_wins      INT NOT NULL DEFAULT 0,
    avatar          VARCHAR(MAX) NULL,          -- Horse avatar stored in Base64
    description     NVARCHAR(MAX) NULL          -- Horse description
);
GO

CREATE TABLE RaceInvitation (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    race_id     INT NOT NULL,
    horse_id    INT NOT NULL,
    owner_id    INT NOT NULL,
    jockey_id   INT NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, EXPIRED
    CONSTRAINT CK_Invite_Status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'))
);
GO

CREATE TABLE RaceEntry (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    race_id             INT NOT NULL,
    horse_id            INT NOT NULL,
    jockey_id           INT NOT NULL,
    gate_number         INT NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING_ADMIN', -- PENDING_ADMIN, APPROVED, RUNNING, FINISHED, DISQUALIFIED, REJECTED
    final_position      INT NULL,                           -- Individual finish position
    finish_time         VARCHAR(20) NULL,                   -- Individual race finish time
    prize_money         DECIMAL(18,2) NULL DEFAULT 0,
    carried_weight      DECIMAL(5,2) NULL,
    rating_adjustment   INT NULL,
    handicap_weight     DECIMAL(5,2) NULL,
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

-- System Notifications Table
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

-- Table for Horse Retirement Requests
CREATE TABLE HorseRetirementRequest (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    horse_id      INT NOT NULL,
    owner_id      INT NOT NULL,
    reason        NVARCHAR(MAX) NOT NULL,
    status        VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    admin_remarks NVARCHAR(MAX) NULL,
    created_at    DATETIME DEFAULT GETDATE(),
    processed_at  DATETIME NULL
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
GO

-- ==========================================
-- INSERT SAMPLE DATA
-- ==========================================

INSERT INTO SystemConfig (config_key, config_value, description) VALUES
('MAX_TOP_WEIGHT',         '60.0', N'Maximum carried weight allowance (kg)'),
('MIN_BOTTOM_WEIGHT',      '52.0', N'Minimum carried weight allowance (kg)'),
('WEIGHT_PER_POINT',       '0.5',  N'Weight adjustment in kg per 1 point rating difference'),
('MAX_OVERWEIGHT_ALLOWED', '1.0',  N'Maximum allowed overweight allowance for Jockey (kg)'),
('SEX_ALLOWANCE',          '1.5',  N'Sex allowance for female horses (Fillies/Mares) (kg)');
GO

INSERT INTO Role (role_name) VALUES ('Admin'), ('Owner'), ('Jockey'), ('Spectator'), ('Referee');
GO

-- All accounts have default password: 123456
INSERT INTO [User] (role_id, username, password_hash, email, status, weight, total_races_participated, total_top3_finishes, full_name, wallet_balance) VALUES
(1, 'admin_root',      '123456', 'admin@horserace.com',  'ACTIVE', NULL, NULL, NULL, N'Administrator', 1000000.00),
(2, 'owner_jackson',   '123456', 'jackson@owners.com',   'ACTIVE', NULL, NULL, NULL, N'James Jackson',   50000.00),
(2, 'owner_miller',    '123456', 'miller@owners.com',    'ACTIVE', NULL, NULL, NULL, N'Robert Miller',    30000.00),
(2, 'owner_chen',      '123456', 'chen@owners.com',      'ACTIVE', NULL, NULL, NULL, N'Chen Wei',         25000.00),
(3, 'jockey_ryan',     '123456', 'ryan@jockeys.com',     'ACTIVE', 58.5, 45, 20,    N'Ryan Thompson',   15000.00),
(3, 'jockey_emma',     '123456', 'emma@jockeys.com',     'ACTIVE', 52.0, 20, 8,     N'Emma Clarke',      10000.00),
(3, 'jockey_carlos',   '123456', 'carlos@jockeys.com',   'ACTIVE', 55.3, 80, 35,    N'Carlos Rivera',    20000.00),
(3, 'jockey_naomi',    '123456', 'naomi@jockeys.com',    'ACTIVE', 53.7, 4,  1,     N'Naomi Watanabe',    5000.00),
(4, 'fan_oliver',      '123456', 'oliver@fans.com',      'ACTIVE', NULL, NULL, NULL, N'Oliver Bennett',    1000.00),
(5, 'referee_harris',  '123456', 'harris@referees.com',  'ACTIVE', NULL, NULL, NULL, N'Michael Harris',   10000.00),
(5, 'referee_scott',   '123456', 'scott@referees.com',   'ACTIVE', NULL, NULL, NULL, N'David Scott',      10000.00);
GO

INSERT INTO Horse (owner_id, name, breed, sex, date_of_birth, status, current_rating, total_races, total_wins) VALUES
(2, 'Thunder King', 'Thoroughbred', 'Gelding', '2018-04-10', 'ACTIVE',  88, 0, 0),
(2, 'Silver Arrow',  'Arabian',      'Horse',   '2019-07-22', 'ACTIVE',  75, 0, 0),
(3, 'Storm Runner',  'Quarter Horse','Gelding', '2017-11-05', 'ACTIVE',  82, 0, 0),
(3, 'Dark Phantom',  'Thoroughbred', 'Mare',    '2020-02-18', 'ACTIVE',  65, 0, 0),
(4, 'Golden Flash',  'Akhal-Teke',   'Mare',    '2018-09-30', 'ACTIVE',  91, 0, 0),
(4, 'Iron Blaze',    'Hanoverian',   'Colt',    '2019-03-14', 'ACTIVE',  78, 0, 0);
GO

PRINT 'HorseRacingDB created successfully: notifications & wallet_balance columns added, all passwords set to 123456.';
GO
