export enum UserVerifyStatus {
  Unverified, // not verified email, default = 0
  Verified, // verified email
  Banned // banned
}

export enum TokenTypes {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerificationToken
}
