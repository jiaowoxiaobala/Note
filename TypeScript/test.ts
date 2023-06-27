type a = {
  name: string;
  age: number;
};

type b = {
  name: string;
  height: number;
};

type c = keyof a | keyof b;