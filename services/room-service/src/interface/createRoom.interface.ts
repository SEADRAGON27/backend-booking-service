export interface CreateRoom {
  type: string;
  capacity: number;
  description: string;
  location: string;
  originalPrice: number;
  buildingTypeId: number;
  discountedPrice?: number;
  name: string;
}
