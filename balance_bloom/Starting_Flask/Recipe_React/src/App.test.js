import { render, screen, fireEvent, waitFor, within} from '@testing-library/react';
import App from './App';

// Import the actual data used by the component
import { RecommendedRecipes } from "./data/constants";

// Mock the global fetch function
global.fetch = jest.fn();

// Sample data for testing search results
const mockSearchResults = [
  { id: 101, title: 'Test Pasta', image: 'pasta.jpg' },
  { id: 102, title: 'Test Salad', image: 'salad.jpg' },
];

describe('App Component (Recipe Recommendation)', () => {

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 'rec1', title: 'Test Pasta' }, { id: 'rec2', title: 'Test Salad' }])
      })
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });


  // --- Test Case 1: Initial Load State ---
  test('renders the Popular Recipes list on initial load', () => {
    render(<App />);

    // Check for the main title
    expect(screen.getByText(/Recipe Recommendation/i)).toBeInTheDocument();
    
    // Check for the initial list title
    expect(screen.getByText('⭐ Popular & Recommended Recipes')).toBeInTheDocument();
    
    // Check that one of the recommended recipes is visible
    expect(screen.getAllByText(RecommendedRecipes[0].title)[0]).toBeInTheDocument();
  });

  // --- Test Case 2: Favorite Toggling Logic ---
  test('toggles a recipe as favorite and updates the FavoritesList', () => {
    render(<App />);
    
    // 1. ARRANGE: Find the recipe card element (or button)
    const initialRecipeTitle = RecommendedRecipes[0].title;
    
    // Check initial state: Favorites list should be empty
    expect(screen.getByText('No favorites yet ❤️')).toBeInTheDocument();

    // **DEFINE the favorites container for scoping**
    const favoritesSectionHeading = screen.getByRole('heading', { name: /My Favorite Recipes/i });
    const favoritesContainer = favoritesSectionHeading.parentElement;

    // 2. ACT: Simulate clicking the favorite button/link for the first recipe
    // Find the initial '🤍' button
    const favoriteButton = screen.getAllByRole('button', { name: '🤍' })[0];
    fireEvent.click(favoriteButton); // Add to favorites

    // 3. ASSERT: The recipe should now be in the FavoritesList (Scoped check)
    // Use 'within' to query ONLY the favorites container.
    expect(within(favoritesContainer).getByText(initialRecipeTitle)).toBeInTheDocument(); 

    // 4. ACT: Click the favorite button again to remove it (button text changes to '💖')
    const activeFavoriteButton = screen.getAllByRole('button', { name: '💖' })[0];
    fireEvent.click(activeFavoriteButton); // Remove from favorites

    // 5. ASSERT: FavoritesList should be empty again
    expect(screen.getByText('No favorites yet ❤️')).toBeInTheDocument();
    
    // **FIX: Use 'within' to query ONLY the favorites container for absence.**
    expect(within(favoritesContainer).queryByText(initialRecipeTitle)).not.toBeInTheDocument(); 
  });

  // --- Test Case 3: Loading State Behavior ---
  test('shows loading indicator during recipe search', async () => {
    // ARRANGE: Mock the fetch call to never resolve (simulates an ongoing network request)
    fetch.mockImplementationOnce(() => new Promise(() => {})); 

    render(<App />);
    
    // ARRANGE: Find the search button (in RecipeSearchForm)
    const searchButton = screen.getByRole('button', { name: /Search/i });
    
    // ACT: Click the search button
    fireEvent.click(searchButton);

    // ASSERT: The loading text should appear immediately
    expect(screen.getByText('⏳ Loading recipes...')).toBeInTheDocument();
    
    // ASSERT: The popular list should be gone
    expect(screen.queryByText('⭐ Popular & Recommended Recipes')).not.toBeInTheDocument();
  });

  // --- Test Case 4: Successful Search and Display ---
  test('displays search results and hides popular list on successful search', async () => {
    // ARRANGE: Mock the successful fetch response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResults,
    });

    render(<App />);
    
    // ARRANGE: Find search elements
    const searchButton = screen.getByRole('button', { name: 'Search' });
    
    // ACT: Click the search button
    fireEvent.click(searchButton);

    // ASSERT 1: Wait for the loading state to disappear
    await waitFor(() => expect(screen.queryByText('⏳ Loading recipes...')).not.toBeInTheDocument());

    // ASSERT 2: Check for search results list title and items
    expect(screen.getByText('Search Results')).toBeInTheDocument();
    const pastaElements = screen.getAllByText('Test Pasta');
    expect(pastaElements.length).toBeGreaterThan(0);

    const SaladElements = screen.getAllByText('Test Salad');
    expect(pastaElements.length).toBeGreaterThan(0);
    
    // ASSERT 3: The popular list should be hidden
    expect(screen.queryByText('⭐ Popular & Recommended Recipes')).not.toBeInTheDocument();
  });

  });