USE HorseRacingDB;
GO

-- =========================================================================
-- 1. CHÈN 20 NÀI NGỰA MỚI (JOCKEYS)
-- =========================================================================
DECLARE @j INT = 1;
WHILE @j <= 20
BEGIN
    INSERT INTO [User] (role_id, username, password_hash, email, status, weight, total_races_participated, total_top3_finishes, full_name)
    VALUES (
        3, 
        'jockey_' + CAST(@j AS VARCHAR(10)), 
        'hash_joc_' + RIGHT('00' + CAST(@j AS VARCHAR(10)), 3), 
        'jockey_' + CAST(@j AS VARCHAR(10)) + '@jockeys.com', 
        'ACTIVE', 
        50.0 + (CAST(RAND(CHECKSUM(NEWID())) * 10 AS DECIMAL(5,2))), -- Cân nặng ngẫu nhiên từ 50 đến 60 kg
        CAST(RAND(CHECKSUM(NEWID())) * 50 AS INT),                   -- Tổng số trận ngẫu nhiên
        CAST(RAND(CHECKSUM(NEWID())) * 20 AS INT),                   -- Lượt top 3 ngẫu nhiên
        CASE @j
            WHEN 1 THEN N'Lewis Hamilton' WHEN 2 THEN N'Fernando Alonso' WHEN 3 THEN N'Sebastian Vettel' WHEN 4 THEN N'Max Verstappen'
            WHEN 5 THEN N'Charles Leclerc' WHEN 6 THEN N'Kimi Raikkonen' WHEN 7 THEN N'Valtteri Bottas' WHEN 8 THEN N'Daniel Ricciardo'
            WHEN 9 THEN N'Lando Norris' WHEN 10 THEN N'George Russell' WHEN 11 THEN N'Pierre Gasly' WHEN 12 THEN N'Esteban Ocon'
            WHEN 13 THEN N'Sergio Perez' WHEN 14 THEN N'Carlos Sainz' WHEN 15 THEN N'Lance Stroll' WHEN 16 THEN N'Alex Albon'
            WHEN 17 THEN N'Yuki Tsunoda' WHEN 18 THEN N'Mick Schumacher' WHEN 19 THEN N'Guanyu Zhou' WHEN 20 THEN N'Kevin Magnussen'
        END
    );
    SET @j = @j + 1;
END;

-- =========================================================================
-- 2. CHÈN 20 KHÁN GIẢ MỚI (SPECTATORS)
-- =========================================================================
DECLARE @s INT = 1;
WHILE @s <= 20
BEGIN
    INSERT INTO [User] (role_id, username, password_hash, email, status, full_name)
    VALUES (
        4, 
        'spectator_' + CAST(@s AS VARCHAR(10)), 
        'hash_spec_' + RIGHT('00' + CAST(@s AS VARCHAR(10)), 3), 
        'spectator_' + CAST(@s AS VARCHAR(10)) + '@spectators.com', 
        'ACTIVE', 
        CASE @s
            WHEN 1 THEN N'Oliver Bennett' WHEN 2 THEN N'Lucas Miller' WHEN 3 THEN N'Mia Garcia' WHEN 4 THEN N'Liam Wilson'
            WHEN 5 THEN N'Ava Anderson' WHEN 6 THEN N'Noah Taylor' WHEN 7 THEN N'Isabella Thomas' WHEN 8 THEN N'William Martinez'
            WHEN 9 THEN N'Sophia Robinson' WHEN 10 THEN N'James Clark' WHEN 11 THEN N'Charlotte Rodriguez' WHEN 12 THEN N'Benjamin Lewis'
            WHEN 13 THEN N'Amelia Lee' WHEN 14 THEN N'Lucas Walker' WHEN 15 THEN N'Evelyn Hall' WHEN 16 THEN N'Alexander Allen'
            WHEN 17 THEN N'Harper Young' WHEN 18 THEN N'Daniel King' WHEN 19 THEN N'Emily Wright' WHEN 20 THEN N'Logan Hill'
        END
    );
    SET @s = @s + 1;
END;

-- =========================================================================
-- 3. CHÈN 5 TRỌNG TÀI MỚI (REFEREES)
-- =========================================================================
DECLARE @r INT = 1;
WHILE @r <= 5
BEGIN
    INSERT INTO [User] (role_id, username, password_hash, email, status, full_name)
    VALUES (
        5, 
        'referee_' + CAST(@r AS VARCHAR(10)), 
        'hash_ref_' + RIGHT('00' + CAST(@r AS VARCHAR(10)), 3), 
        'referee_' + CAST(@r AS VARCHAR(10)) + '@referees.com', 
        'ACTIVE', 
        CASE @r
            WHEN 1 THEN N'Thomas Clark' WHEN 2 THEN N'Sarah Taylor' WHEN 3 THEN N'Robert Miller' WHEN 4 THEN N'John Davis' WHEN 5 THEN N'Jessica Smith'
        END
    );
    SET @r = @r + 1;
END;

-- =========================================================================
-- 4. CHÈN 20 CHỦ NGỰA MỚI (OWNERS) VÀ LƯU ID CỦA HỌ
-- =========================================================================
DECLARE @InsertedOwners TABLE (id INT, idx INT IDENTITY(1,1));

INSERT INTO [User] (role_id, username, password_hash, email, status, full_name)
OUTPUT inserted.id INTO @InsertedOwners(id)
VALUES 
(2, 'owner_william',   'hash_own_101', 'william@owners.com',   'ACTIVE', N'William Davis'),
(2, 'owner_sophia',    'hash_own_102', 'sophia@owners.com',    'ACTIVE', N'Sophia Martinez'),
(2, 'owner_oliver',    'hash_own_103', 'oliver@owners.com',    'ACTIVE', N'Oliver Bennett'),
(2, 'owner_emma',      'hash_own_104', 'emma@owners.com',      'ACTIVE', N'Emma Watson'),
(2, 'owner_lucas',     'hash_own_105', 'lucas@owners.com',     'ACTIVE', N'Lucas Miller'),
(2, 'owner_mia',       'hash_own_106', 'mia@owners.com',       'ACTIVE', N'Mia Garcia'),
(2, 'owner_alexander', 'hash_own_107', 'alexander@owners.com', 'ACTIVE', N'Alexander Rodriguez'),
(2, 'owner_charlotte', 'hash_own_108', 'charlotte@owners.com', 'ACTIVE', N'Charlotte Wilson'),
(2, 'owner_ethan',     'hash_own_109', 'ethan@owners.com',     'ACTIVE', N'Ethan Thomas'),
(2, 'owner_amelia',    'hash_own_110', 'amelia@owners.com',    'ACTIVE', N'Amelia Anderson'),
(2, 'owner_daniel',    'hash_own_111', 'daniel@owners.com',    'ACTIVE', N'Daniel Taylor'),
(2, 'owner_harper',    'hash_own_112', 'harper@owners.com',    'ACTIVE', N'Harper Moore'),
(2, 'owner_james',     'hash_own_113', 'james@owners.com',     'ACTIVE', N'James Jackson'),
(2, 'owner_evelyn',    'hash_own_114', 'evelyn@owners.com',    'ACTIVE', N'Evelyn Martin'),
(2, 'owner_benjamin',  'hash_own_115', 'benjamin@owners.com',  'ACTIVE', N'Benjamin Lee'),
(2, 'owner_abigail',   'hash_own_116', 'abigail@owners.com',   'ACTIVE', N'Abigail Thompson'),
(2, 'owner_michael',   'hash_own_117', 'michael@owners.com',   'ACTIVE', N'Michael Harris'),
(2, 'owner_emily',     'hash_own_118', 'emily@owners.com',     'ACTIVE', N'Emily White'),
(2, 'owner_logan',     'hash_own_119', 'logan@owners.com',     'ACTIVE', N'Logan Sanchez'),
(2, 'owner_madison',   'hash_own_120', 'madison@owners.com',   'ACTIVE', N'Madison Clark');

-- =========================================================================
-- 5. KHAI BÁO DANH SÁCH 50 TÊN CHIẾN MÃ MẪU
-- =========================================================================
DECLARE @HorseNames TABLE (name VARCHAR(150), breed VARCHAR(100), sex VARCHAR(20), idx INT IDENTITY(1,1));
INSERT INTO @HorseNames (name, breed, sex) VALUES
('Golden Legend', 'Thoroughbred', 'Colt'),
('Pegasus Dream', 'Arabian', 'Filly'),
('Midnight Fury', 'Hanoverian', 'Gelding'),
('Black Beauty', 'Thoroughbred', 'Mare'),
('Lightning Bolt', 'Arabian', 'Horse'),
('Wind Racer', 'Quarter Horse', 'Colt'),
('Desert Star', 'Akhal-Teke', 'Filly'),
('Ocean Breeze', 'Thoroughbred', 'Mare'),
('Silver Shadow', 'Hanoverian', 'Gelding'),
('Iron Clad', 'Quarter Horse', 'Colt'),
('Eclipse', 'Thoroughbred', 'Gelding'),
('Thunder Struck', 'Arabian', 'Horse'),
('Solar Flare', 'Akhal-Teke', 'Filly'),
('Blazing Saddles', 'Quarter Horse', 'Colt'),
('Gypsy Queen', 'Hanoverian', 'Mare'),
('Red Rum', 'Thoroughbred', 'Gelding'),
('Secretariat II', 'Thoroughbred', 'Colt'),
('Man o War', 'Thoroughbred', 'Horse'),
('Seattle Slew', 'Thoroughbred', 'Gelding'),
('Affirmed', 'Thoroughbred', 'Colt'),
('Citation', 'Thoroughbred', 'Gelding'),
('Spectacular Bid', 'Thoroughbred', 'Horse'),
('Count Fleet', 'Thoroughbred', 'Gelding'),
('Whirlaway', 'Thoroughbred', 'Colt'),
('War Admiral', 'Thoroughbred', 'Horse'),
('Assault', 'Thoroughbred', 'Gelding'),
('Sir Barton', 'Thoroughbred', 'Colt'),
('Gallant Fox', 'Thoroughbred', 'Gelding'),
('Phar Lap', 'Thoroughbred', 'Gelding'),
('Shergar', 'Thoroughbred', 'Colt'),
('Frankel', 'Thoroughbred', 'Horse'),
('Zenyatta', 'Thoroughbred', 'Mare'),
('Ruffian', 'Thoroughbred', 'Filly'),
('Black Caviar', 'Thoroughbred', 'Mare'),
('Winx', 'Thoroughbred', 'Mare'),
('Makybe Diva', 'Thoroughbred', 'Mare'),
('Enable', 'Thoroughbred', 'Mare'),
('Sea the Stars', 'Thoroughbred', 'Horse'),
('Dancing Brave', 'Thoroughbred', 'Horse'),
('Nijinsky', 'Thoroughbred', 'Horse'),
('Mill Reef', 'Thoroughbred', 'Horse'),
('Brigadier Gerard', 'Thoroughbred', 'Horse'),
('Arkle', 'Irish Draft', 'Gelding'),
('Red Rum II', 'Thoroughbred', 'Gelding'),
('Desert Orchid', 'Thoroughbred', 'Gelding'),
('Kauto Star', 'AQPS', 'Gelding'),
('Denman', 'AQPS', 'Gelding'),
('Best Mate', 'Irish Draft', 'Gelding'),
('Hurricane Fly', 'Thoroughbred', 'Gelding'),
('Istabraq', 'Thoroughbred', 'Gelding');

-- =========================================================================
-- 6. VÒNG LẶP CHÈN 50 CHIẾN MÃ (CHIA ĐỀU CHO 20 CHỦ NGỰA)
-- =========================================================================
DECLARE @k INT = 1;
DECLARE @owner_id INT;
DECLARE @h_name VARCHAR(150), @h_breed VARCHAR(100), @h_sex VARCHAR(20);

WHILE @k <= 50
BEGIN
    -- Lấy ID của chủ ngựa tiếp theo (xoay vòng từ 1 đến 20)
    SELECT @owner_id = id FROM @InsertedOwners WHERE idx = ((@k - 1) % 20) + 1;
    
    -- Lấy thông tin ngựa mẫu từ danh sách
    SELECT @h_name = name, @h_breed = breed, @h_sex = sex FROM @HorseNames WHERE idx = @k;

    -- Chèn vào bảng Horse với điểm Rating ngẫu nhiên từ 52 đến 95
    INSERT INTO Horse (owner_id, name, breed, sex, date_of_birth, status, current_rating, total_races, total_wins)
    VALUES (
        @owner_id, 
        @h_name, 
        @h_breed, 
        @h_sex, 
        DATEADD(day, -CAST(RAND(CHECKSUM(NEWID())) * 1500 AS INT), '2022-01-01'), -- Ngày sinh ngẫu nhiên từ 2018-2022
        'ACTIVE', 
        52 + CAST(RAND(CHECKSUM(NEWID())) * 43 AS INT),                         -- Rating ngẫu nhiên từ 52 đến 95
        0, 
        0
    );

    SET @k = @k + 1;
END;

PRINT 'Populated database successfully with 20 Jockeys, 20 Spectators, 5 Referees, 20 Owners, and 50 Horses distributed evenly.';
GO