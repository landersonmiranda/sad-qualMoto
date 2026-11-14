import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('simulation_history')
export class SimulationHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'decisor@sad-veiculos.com.br' })
  userEmail: string;

  @Column('float')
  monthlyKm: number;

  @Column('float')
  cityRatio: number;

  @Column('float')
  fuelPriceGasoline: number;

  @Column('float')
  budgetLimitMonthly: number;

  @Column()
  recommendedGroupName: string;

  @Column('float')
  recommendedGroupFitScore: number;

  @Column('float')
  recommendedGroupTco: number;

  @CreateDateColumn()
  createdAt: Date;
}

