import { predictCategory } from "./categoryPrediction";
export default function testCategory(){
console.log(
  predictCategory("Uber ride"),
);

console.log(
  predictCategory("Pizza dinner"),
);

console.log(
  predictCategory("Netflix subscription"),
);

console.log(
  predictCategory("Electricity bill"),
);

console.log(
  predictCategory("New shoes"),
);

console.log(
  predictCategory("Something completely random"),
);
}
