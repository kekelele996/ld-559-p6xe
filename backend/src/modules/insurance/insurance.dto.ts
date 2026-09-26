import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { InsuranceStatus, PolicyType } from '../../constants/enums';

export class CreateInsuranceDto {
  @IsString() petId!: string;
  @IsString() provider!: string;
  @IsEnum(PolicyType) planType!: PolicyType;
  @IsNumber() premium!: number;
  @IsNumber() coverage!: number;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
  @IsEnum(InsuranceStatus) status!: InsuranceStatus;
}

export class UpdateInsuranceDto extends CreateInsuranceDto {}

export class RenewInsuranceDto {
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
  @IsNumber() premium!: number;
  @IsOptional() @IsNumber() coverage?: number;
}
