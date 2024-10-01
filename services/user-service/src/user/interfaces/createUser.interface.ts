export interface CreateUser {
  username: string;
  email: string;
  password: string;
  confirmedPassword: string;
}

export interface CreateUserGoogle {
  username: string;
  token: string
}