// custom.d.ts

// .png 파일을 import하면 string 타입이라는 것을 TypeScript에 알려줍니다.
declare module '*.png' {
  const value: string;
  export default value;
}

// .jpg 파일을 import하면 string 타입이라는 것을 TypeScript에 알려줍니다.
declare module '*.jpg' {
  const value: string;
  export default value;
}

// .jpeg, .gif, .svg 등 다른 이미지 타입도 사용하신다면 아래와 같이 추가할 수 있습니다.
declare module '*.jpeg' {
    const value: string;
    export default value;
}

declare module '*.svg' {
    const value: string;
    export default value;
}