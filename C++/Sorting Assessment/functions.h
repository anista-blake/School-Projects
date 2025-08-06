#ifndef UNTITLED_FUNCTIONS_H
#define UNTITLED_FUNCTIONS_H

#include <iostream>
#include <string>
#include <algorithm>
#include <random>
using namespace std;

int i, j, steps, min_index, key;

void BubbleSort (int arr[], int n) {
  steps = 0;
  for (i = 0; i < (n - 1); i++) {
    for (j = 0; j < (n - i - 1); j++) {
      if (arr[j] > arr[j + 1]) {
        swap(arr[j], arr[j + 1]);
        steps++;
      }
    }
    steps++;
  }
  cout << "Bubble sort took " << steps << " comparisons to sort." << endl;
}

void SelectionSort (int arr[], int n) {
  steps = 0;
  for (i = 0; i < (n - 1); i++) {
    min_index = i;
    for (j = i + 1; j < n; j++) {
      if (arr[j] < arr[min_index]) {
        min_index = j;
      }
      steps++;
    }
    if (min_index != i) {
      swap(arr[i], arr[min_index]);
    }
  }
  cout << "Selection sort took " << steps << " comparisons to sort." << endl;
}

void InsertionSort (int arr[], int n) {
  steps = 0;
  for (i = 1; i < n; i++) {
    key = arr[i];
    j = i - 1;
    while (j >= 0) {
      steps++;
      if (arr[j] > key) {
        arr[j + 1] = arr[j];
        j--;
      }
      else
        break;
    }
    arr[j + 1] = key;
  }
  cout << "Insertion sort took " << steps << " comparisons to sort." << endl;
}

void PrintArray (int arr[], int n) {
  cout << "{ ";
  for (i = 0; i < n; i++) {
    if ((i > 1) && (i % 10 == 0))
      cout << "\n  ";
    cout << arr[i];
    if (i == n - 1)
      cout << " }" << endl;
    else
      cout << ", ";
  }
}

void GenerateAndSortArray (int n) {
  // create the main array and two copies
  int arr[n], copy_arr_one[n], copy_arr_two[n];
  // setup of random number generator
  random_device rd;
  mt19937 gen(rd());
  uniform_int_distribution<int> number(1, 1000);
  for (i = 0; i < n; i++) {
    // generate a random number for each index in the main array
    // then copy the value to the two copy arrays
    arr[i] = number(gen);
    copy_arr_one[i] = arr[i];
    copy_arr_two[i] = arr[i];
  }
  // print the main array to the console
  PrintArray(arr, n);
  // run the arrays into their respective sorting algorithms
  BubbleSort(arr, n);
  SelectionSort(copy_arr_one, n);
  InsertionSort(copy_arr_two, n);
  cout << endl;
}

#endif //UNTITLED_FUNCTIONS_H
