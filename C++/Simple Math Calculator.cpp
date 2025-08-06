#include <iostream>

using namespace std;

int main()

{

	int length, width;

	cout << "Welcome to the simple math calculator!" << endl;
	cout << "You give me the length and width of your rectangle, ";
	cout << "I give you the area and perimeter! :D" << endl;

	cout << "What is the length?";
	cin >> length;

	cout << "What is the width?";
	cin >> width;

	int area = length * width;
	int perimeter = (length * 2) + (width * 2);

	cout << "According to my calculations..." << endl;
	cout << "The area is " << area << "." << endl;
	cout << "The perimeter is " << perimeter << "." << endl;

}