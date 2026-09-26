import { IsDateString, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateRenewalDto {
  @IsString() policyId!: string;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
  @IsNumber() @IsPositive() premium!: number;
}
