import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clearApiMocks, mockApi, mockApiGet, mockApiPost } from "@/__tests__/helpers/api-mock";
import { buildSearchResponse, buildSearchResult } from "@/__tests__/helpers/factories";

vi.mock("next/dynamic", () => ({
  default: () => {
    const MockDynamic = (props: Record<string, unknown>) => (
      <div data-testid="dynamic-component" {...props} />
    );
    MockDynamic.displayName = "DynamicComponent";
    return MockDynamic;
  },
}));

Object.defineProperty(window, "location", {
  value: { href: "", assign: vi.fn(), replace: vi.fn() },
  writable: true,
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

async function importSearchPage() {
  const mod = await import("@/app/(app)/search/page");
  return mod.default;
}

describe("SearchPage", () => {
  beforeEach(() => {
    clearApiMocks();
  });

  it("renders the search input and type badge", async () => {
    const SearchPage = await importSearchPage();
    render(<SearchPage />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText("Search for albums or playlists...")).toBeInTheDocument();
    expect(screen.getByTitle("Album selected")).toBeInTheDocument();
  });

  it("performs a search on Enter and displays results", async () => {
    const user = userEvent.setup();
    const results = [
      buildSearchResult({ browseId: "id1", title: "Album One", artist: ["Artist A"] }),
      buildSearchResult({ browseId: "id2", title: "Album Two", artist: ["Artist B"] }),
    ];
    mockApiGet(buildSearchResponse({ results }));

    const SearchPage = await importSearchPage();
    render(<SearchPage />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("Search for albums or playlists...");
    await user.type(input, "test query");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Album One")).toBeInTheDocument();
      expect(screen.getByText("Album Two")).toBeInTheDocument();
    });
  });

  it("renders 'no results' when search returns empty", async () => {
    const user = userEvent.setup();
    mockApiGet(buildSearchResponse({ results: [] }));

    const SearchPage = await importSearchPage();
    render(<SearchPage />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("Search for albums or playlists...");
    await user.type(input, "empty query");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("No results found.")).toBeInTheDocument();
    });
  });

  it("shows error message on search failure", async () => {
    const user = userEvent.setup();
    mockApi.get.mockRejectedValue(new Error("Search failed"));

    const SearchPage = await importSearchPage();
    render(<SearchPage />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("Search for albums or playlists...");
    await user.type(input, "fail");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Search failed")).toBeInTheDocument();
    });
  });

  it("toggles selection and shows download badge", async () => {
    const user = userEvent.setup();
    const results = [buildSearchResult({ browseId: "select-id", title: "Selectable Album" })];
    mockApiGet(buildSearchResponse({ results }));

    const SearchPage = await importSearchPage();
    render(<SearchPage />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("Search for albums or playlists...");
    await user.type(input, "select");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Selectable Album")).toBeInTheDocument();
    });

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("calls download API on download button click", async () => {
    const user = userEvent.setup();
    const results = [buildSearchResult({ browseId: "dl-id", title: "Download Album" })];
    mockApiGet(buildSearchResponse({ results }));
    mockApiPost({ job_id: 99, status: "running" });

    const SearchPage = await importSearchPage();
    render(<SearchPage />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("Search for albums or playlists...");
    await user.type(input, "download");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Download Album")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByTitle("Start download"));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/download/album", { id: "dl-id", concurrent: 4 });
    });
  });

  it("shows green check badge for already-available albums", async () => {
    const user = userEvent.setup();
    const results = [
      buildSearchResult({ browseId: "avail-id", title: "Available Album", available: true }),
      buildSearchResult({ browseId: "other-id", title: "New Album", available: false }),
    ];
    mockApiGet(buildSearchResponse({ results }));

    const SearchPage = await importSearchPage();
    render(<SearchPage />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("Search for albums or playlists...");
    await user.type(input, "available");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Available Album")).toBeInTheDocument();
      expect(screen.getByText("New Album")).toBeInTheDocument();
    });

    expect(screen.getAllByTitle("Already in library")).toHaveLength(1);
  });

  it("opens and closes settings panel", async () => {
    const user = userEvent.setup();
    const results = [buildSearchResult({ browseId: "set-id", title: "Settings Album" })];
    mockApiGet(buildSearchResponse({ results }));

    const SearchPage = await importSearchPage();
    render(<SearchPage />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("Search for albums or playlists...");
    await user.type(input, "settings");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Settings Album")).toBeInTheDocument();
    });

    await user.click(screen.getByTitle("Concurrent downloads"));
    expect(screen.getByText("Concurrent downloads")).toBeInTheDocument();

    await user.click(screen.getByTitle("Concurrent downloads"));
    expect(screen.queryByText("Concurrent downloads")).not.toBeInTheDocument();
  });
});
