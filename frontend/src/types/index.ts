// Khop voi cac Entity ben Spring Boot backend (com.horseracing.backend.entity.*)

export interface User {
  id: number;
  username: string;
  email: string;
  roleId: number;
  status: string;
  requireOtp?: boolean;
  totalRacesParticipated?: number;
  totalTop3Finishes?: number;
  avatar?: string;
  fullName?: string;
  biography?: string;
}

export interface Horse {
  id: number;
  name: string;
  ownerId: number;
  status: string;
  currentRating: number;
}

export interface RaceMeeting {
  id: number;
  seasonId: number;
  // TODO: bo sung field con thieu
}

export interface Race {
  id: number;
  raceMeetingId: number;
  status: string;
  youtubeLiveUrl?: string | null;
}

export interface RaceEntry {
  id: number;
  raceId: number;
  horseId: number;
  jockeyId: number;
  status: string;
  gateNumber?: number;
  handicapWeight?: number;
  carriedWeight?: number;
}

export interface RaceInvitation {
  id: number;
  jockeyId: number;
  ownerId: number;
  raceId: number;
  status: string;
}

export interface RaceReferee {
  id: number;
  raceId: number;
  refereeId: number;
}

export interface Season {
  id: number;
  startDate: string;
  status: string;
}

export interface SystemConfig {
  configKey: string;
  configValue: string;
  updatedAt?: string;
}

export interface Violation {
  id: number;
  raceId: number;
  jockeyId: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}
