import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty() @IsString()
  identifiant: string; 
  @IsNotEmpty() @IsString()
  password: string;
}
