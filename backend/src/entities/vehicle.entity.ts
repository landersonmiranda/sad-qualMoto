import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MotoCategory } from '../common/types';

@Entity('vehicles')
export class VehicleEntity {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  fipeCode: string;

  @Column()
  name: string;

  @Column()
  brand: string;

  @Column()
  category: MotoCategory;

  @Column('int')
  year: number;

  @Column('float')
  price: number;

  @Column('float')
  monthlyFinancing: number;

  @Column('float')
  fipeDepreciationYearly: number;

  @Column('float')
  cityKml: number;

  @Column('float')
  highwayKml: number;

  @Column('float')
  ipvaRate: number;

  @Column('float')
  licensingAnnual: number;

  @Column('float')
  insuranceAnnual: number;

  @Column('float')
  maintenancePerKm: number;

  @Column('float')
  comfortScore: number;

  @Column('float')
  performanceScore: number;

  @Column('float')
  reliabilityScore: number;

  @Column('float')
  resaleLiquidityScore: number;

  @Column({ nullable: true })
  badge: string;

  @Column({ nullable: true })
  fipeReferenceMonth: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

