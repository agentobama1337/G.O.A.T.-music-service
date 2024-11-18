// Реализация функции map
function customMap(callback, thisArg) {
    if (typeof callback !== "function") {
      throw new TypeError(`${callback} is not a function`);
    }
  
    const result = new Array(this.length); // Создаем новый массив такой же длины
    for (let i = 0; i < this.length; i++) {
      if (i in this) {
        result[i] = callback.call(thisArg, this[i], i, this);
      }
    }
    return result;
  }
  
  // Замена стандартной функции map в Array
  Array.prototype.map = customMap;
  
  // Проверка работы
  const array = [1, 2, 3, 4, 5];
  
  // Используем наш переопределённый map
  const doubled = array.map((num) => num * 2);
  
  console.log(doubled); // [2, 4, 6, 8, 10]
  