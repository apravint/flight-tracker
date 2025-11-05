
export type ActiveTab = 'Search' | 'Planner' | 'Inspiration' | 'Live Agent';

export interface Flight {
  flightNumber: string;
  airline: string;
  departure: {
    airport: string;
    city: string;
    time: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
  };
  duration: string;
  price: number;
}

export interface GroundingSource {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
