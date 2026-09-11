export interface VehicleModel {
  id: string;
  category: 'lab' | 'real';
  nameVi: string;
  nameEn: string;
  shortName: string;
  defaultMass: number; // in kg
  minMass: number;
  maxMass: number;
  massStep: number;
  defaultSpeed: number; // in m/s
  minSpeed: number; // in m/s
  maxSpeed: number; // in m/s
  speedStep: number;
  color: string;
  stroke: string;
  iconType: 'compact' | 'sedan' | 'truck' | 'bike';
  descVi: string;
  speedPresets: { mps: number; kmh: number; label: string }[];
}

export interface ObstacleModel {
  id: string;
  category: 'foam' | 'wood' | 'barrel' | 'concrete';
  nameVi: string;
  nameEn: string;
  shortName: string;
  defaultMass: number; // in kg
  minMass: number;
  maxMass: number;
  massStep: number;
  frictionCoeff: number; // mu
  color: string;
  borderColor: string;
  descVi: string;
  massPresets: number[];
}

export const LAB_VEHICLES: VehicleModel[] = [
  {
    id: 'lab-1',
    category: 'lab',
    nameVi: 'Xe nhỏ (1 kg)',
    nameEn: 'Small Cart (1 kg)',
    shortName: 'Xe nhỏ',
    defaultMass: 1,
    minMass: 0.5,
    maxMass: 2.0,
    massStep: 0.5,
    defaultSpeed: 4,
    minSpeed: 1,
    maxSpeed: 8,
    speedStep: 0.5,
    color: '#f59e0b',
    stroke: '#d97706',
    iconType: 'compact',
    descVi: 'Xe lăn thí nghiệm nhỏ gọn dùng trên đệm khí / máng nghiêng',
    speedPresets: [
      { mps: 2, kmh: 7.2, label: '2 m/s' },
      { mps: 4, kmh: 14.4, label: '4 m/s (Chuẩn)' },
      { mps: 6, kmh: 21.6, label: '6 m/s' },
      { mps: 8, kmh: 28.8, label: '8 m/s' },
    ],
  },
  {
    id: 'lab-2',
    category: 'lab',
    nameVi: 'Xe vừa (2 kg)',
    nameEn: 'Medium Cart (2 kg)',
    shortName: 'Xe vừa',
    defaultMass: 2,
    minMass: 1.0,
    maxMass: 3.5,
    massStep: 0.5,
    defaultSpeed: 4,
    minSpeed: 1,
    maxSpeed: 8,
    speedStep: 0.5,
    color: '#3b82f6',
    stroke: '#2563eb',
    iconType: 'compact',
    descVi: 'Xe thí nghiệm tiêu chuẩn có tải trọng trung bình',
    speedPresets: [
      { mps: 2, kmh: 7.2, label: '2 m/s' },
      { mps: 4, kmh: 14.4, label: '4 m/s (Chuẩn)' },
      { mps: 6, kmh: 21.6, label: '6 m/s' },
      { mps: 8, kmh: 28.8, label: '8 m/s' },
    ],
  },
  {
    id: 'lab-4',
    category: 'lab',
    nameVi: 'Xe lớn (4 kg)',
    nameEn: 'Heavy Cart (4 kg)',
    shortName: 'Xe lớn',
    defaultMass: 4,
    minMass: 2.0,
    maxMass: 6.0,
    massStep: 0.5,
    defaultSpeed: 4,
    minSpeed: 1,
    maxSpeed: 8,
    speedStep: 0.5,
    color: '#ef4444',
    stroke: '#dc2626',
    iconType: 'compact',
    descVi: 'Xe thí nghiệm gắn quả nặng gia tải 4 kg',
    speedPresets: [
      { mps: 2, kmh: 7.2, label: '2 m/s' },
      { mps: 4, kmh: 14.4, label: '4 m/s (Chuẩn)' },
      { mps: 6, kmh: 21.6, label: '6 m/s' },
      { mps: 8, kmh: 28.8, label: '8 m/s' },
    ],
  },
];

export const REAL_VEHICLES: VehicleModel[] = [
  {
    id: 'real-moto',
    category: 'real',
    nameVi: 'Xe máy thực tế (120 kg)',
    nameEn: 'Motorbike (120 kg)',
    shortName: 'Xe máy',
    defaultMass: 120,
    minMass: 80,
    maxMass: 250,
    massStep: 10,
    defaultSpeed: 15, // 54 km/h
    minSpeed: 5, // 18 km/h
    maxSpeed: 25, // 90 km/h
    speedStep: 2.5,
    color: '#06b6d4',
    stroke: '#0891b2',
    iconType: 'bike',
    descVi: 'Xe máy tay ga / xe số phổ thông lưu thông trên đường phố',
    speedPresets: [
      { mps: 10, kmh: 36, label: '36 km/h' },
      { mps: 15, kmh: 54, label: '54 km/h (Đô thị)' },
      { mps: 20, kmh: 72, label: '72 km/h (Đường trường)' },
      { mps: 25, kmh: 90, label: '90 km/h (Rất nhanh)' },
    ],
  },
  {
    id: 'real-car',
    category: 'real',
    nameVi: 'Ô tô con thực tế (1.500 kg)',
    nameEn: 'Sedan Car (1,500 kg)',
    shortName: 'Ô tô con',
    defaultMass: 1500,
    minMass: 900,
    maxMass: 2800,
    massStep: 50,
    defaultSpeed: 20, // 72 km/h
    minSpeed: 5,
    maxSpeed: 30, // 108 km/h
    speedStep: 2.5,
    color: '#8b5cf6',
    stroke: '#7c3aed',
    iconType: 'sedan',
    descVi: 'Ô tô con 4 - 5 chỗ (Sedan / SUV) lưu thông đường bộ',
    speedPresets: [
      { mps: 10, kmh: 36, label: '36 km/h' },
      { mps: 15, kmh: 54, label: '54 km/h (Phố)' },
      { mps: 20, kmh: 72, label: '72 km/h (Quốc lộ)' },
      { mps: 25, kmh: 90, label: '90 km/h (Cao tốc)' },
    ],
  },
  {
    id: 'real-truck',
    category: 'real',
    nameVi: 'Xe tải nặng thực tế (8.000 kg)',
    nameEn: 'Heavy Cargo Truck (8,000 kg)',
    shortName: 'Xe tải lớn',
    defaultMass: 8000,
    minMass: 3500,
    maxMass: 16000,
    massStep: 500,
    defaultSpeed: 15, // 54 km/h
    minSpeed: 5,
    maxSpeed: 22.2, // 80 km/h
    speedStep: 2.5,
    color: '#f97316',
    stroke: '#ea580c',
    iconType: 'truck',
    descVi: 'Xe tải chở hàng hạng nặng / Container di chuyển trên quốc lộ',
    speedPresets: [
      { mps: 10, kmh: 36, label: '36 km/h (Đông đúc)' },
      { mps: 15, kmh: 54, label: '54 km/h (Đường trường)' },
      { mps: 20, kmh: 72, label: '72 km/h (Cao tốc)' },
    ],
  },
];

export const ALL_VEHICLES: VehicleModel[] = [...LAB_VEHICLES, ...REAL_VEHICLES];

export const OBSTACLE_MODELS: ObstacleModel[] = [
  {
    id: 'foam',
    category: 'foam',
    nameVi: 'Khối xốp SGK (1 kg)',
    nameEn: 'Foam block (1 kg)',
    shortName: 'Khối xốp SGK',
    defaultMass: 1,
    minMass: 0.2,
    maxMass: 5.0,
    massStep: 0.2,
    frictionCoeff: 1.0, // cho M = 1kg -> Fc = 10N chuẩn SGK KHTN 9
    color: '#92400e',
    borderColor: '#d97706',
    descVi: 'Khối xốp tiêu chuẩn trong thí nghiệm KHTN 9 (Fc = 10 N khi m = 1 kg)',
    massPresets: [0.5, 1, 2, 4],
  },
  {
    id: 'wood',
    category: 'wood',
    nameVi: 'Kiện thùng hàng gỗ (20 kg)',
    nameEn: 'Wooden Cargo Crate (20 kg)',
    shortName: 'Thùng gỗ',
    defaultMass: 20,
    minMass: 5,
    maxMass: 100,
    massStep: 5,
    frictionCoeff: 0.4, // M = 20kg -> Fc = 80N
    color: '#78350f',
    borderColor: '#b45309',
    descVi: 'Kiện gỗ chở hàng đóng đai kim loại bảo vệ hàng hóa',
    massPresets: [10, 20, 50, 80],
  },
  {
    id: 'barrel',
    category: 'barrel',
    nameVi: 'Thùng phuy an toàn giao thông (150 kg)',
    nameEn: 'Impact Safety Barrel (150 kg)',
    shortName: 'Thùng phuy cát',
    defaultMass: 150,
    minMass: 40,
    maxMass: 500,
    massStep: 10,
    frictionCoeff: 0.55, // M = 150kg -> Fc = 825N
    color: '#ca8a04',
    borderColor: '#eab308',
    descVi: 'Thùng phuy chứa cát/nước đặt ở ngã ba, trạm thu phí giảm chấn tai nạn',
    massPresets: [80, 150, 250, 400],
  },
  {
    id: 'concrete',
    category: 'concrete',
    nameVi: 'Dải phân cách bê tông Jersey (1.000 kg)',
    nameEn: 'Concrete Jersey Barrier (1,000 kg)',
    shortName: 'Khối bê tông',
    defaultMass: 1000,
    minMass: 300,
    maxMass: 3000,
    massStep: 100,
    frictionCoeff: 0.75, // M = 1000kg -> Fc = 7500N
    color: '#475569',
    borderColor: '#64748b',
    descVi: 'Khối bê tông dải phân cách cao tốc chống xe lấn làn / đâm xuyên',
    massPresets: [500, 1000, 1500, 2500],
  },
];

export const calculateKineticEnergy = (massKg: number, speedMps: number): number => {
  return 0.5 * massKg * speedMps * speedMps;
};

export const formatEnergy = (joules: number): { main: string; sub?: string } => {
  if (joules >= 1000000) {
    const mj = joules / 1000000;
    const kj = Math.round(joules / 1000);
    return {
      main: `${mj.toFixed(2)} MJ`,
      sub: `${kj.toLocaleString('vi-VN')} kJ`,
    };
  }
  if (joules >= 1000) {
    const kj = joules / 1000;
    const j = Math.round(joules);
    return {
      main: `${kj.toFixed(1)} kJ`,
      sub: `${j.toLocaleString('vi-VN')} J`,
    };
  }
  return {
    main: `${Math.round(joules * 10) / 10} J`,
  };
};

export const formatDistance = (meters: number): { label: string; unit: 'cm' | 'm'; rawCm: number } => {
  const cm = Math.round(meters * 100);
  if (meters < 5) {
    return {
      label: `${cm} cm`,
      unit: 'cm',
      rawCm: cm,
    };
  }
  return {
    label: `${meters.toFixed(2)} m`,
    unit: 'm',
    rawCm: cm,
  };
};
