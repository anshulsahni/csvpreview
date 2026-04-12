# CSV View Product Spec

# Problem Statement

A web application which opens on a browser and allows me to play with CSV files, I should be able to create one from scratch or open an existing one, then edit or download whatever is visible to me on the screen in .csv file format. The application should be lightweight, hence opening a CSV should be a one or two-click operation after opening the application.



# User Stories
## Story 1 - Empty Spreadsheet upon opening

As a user, I should be able to open the app either by using a link on an existing website or by typing the domain csvpreview.com in my address bar. Upon opening, I should be seeing a blank spreadsheet UI, with lots of empty tables and rows, the rows & columns should be marked similarly as Google Sheet does - rows with numbers and columns with alphabets.


## Story 2 - Uploading an existing CSV sheet/content
- As a user, I should be able to view my existing CSV file on csvpreview.com


- As a user, I should be able to upload my CSV on the web app by one of the following method.s
    - Using the upload button & going via the standard upload flow of the native file upload dialogue modal
    - Using the ‘drag-n-drop’ method, I can upload the file, while dragging & then dropping it to the corresponding browser tab.
    - By pasting the CSV content, I have copied from somewhere else, given that the content in the clipboard is in the correct format


- As a user, incase I upload a CSV which is malformed or can’t be parsed, then I should be able to know the exact line at which parsing failed or error ocurrred, with proper user friendlly failure message or essage message


## Story 3 - View CSV content in the table format
- As a user, after uploading/pasting the CSV content, I should be able to view the data in the form of a table, a table created with a visible border of rows & columns. The column should be named with letters starting from A and going on and on, until the data goes & rows should be named as numbers starting from 1 & going on and on until the data goes on
- As a user, I should be able to view empty rows & columns, in case there is no data pasted or uploaded or from any other media possible.
- As a user,r I should be able to view the data of each cell clipped in case it is exceeding the width of the column or new lines are exceeding the height of the cell.


## Story 4 - Selecting Heading Row
- As a user, I should be able to select the top row as the heading row; this way, the heading row remains frozen even when I scroll to the bottom of several rows. The content of the top rows becomes the heading of each column of the CSV content. In case there is a heading row, then scrolling the content will take the row containing the rows of columns (A, B, C, so on…) out of the viewport and the top row of the content, which is visually the second row, when the user is at the top of the page, gets fixed at the top of the content
- As a user, I should be able to deselect the top row as a heading row; this way, all the functionalities mentioned that come with the heading row will be removed. When the user scrolls the content vertically, the names of the columns (A, B, C, and so on…) remain fixed at the top.
## Story 5 - Sorting the data via a particular column
- As a user, I should be able to sort the data via one of the columns by clicking a button (arrow up or arrow down) in the heading row. The button for sorting is actually beside the name of the column (towards the right)
- As a user, if I have not selected a heading row, then I can sort the data via the button given beside the name of the column (A, B, C, so on…)
- As a user, sorting arrows are visible to me beside every column in the neutral state, both up & down arrows are grey for the column which isn’t being used actively for sorting the data.
    - In case of no column being used for sorting, this is the state of every column;, hence, the arrows beside every column are in a grey state.
- As a user, I will be able to sort the data in ascending order using the up arrow (**▲) button.**
- As a user, I will be able to sort the data in descending order using the down arrow (**▼) button.**
- As a user, I won’t worry about data for a particular being numerical or text-based; the system should automatically do that and take care of sorting.g
    - For letter/alphabet - ascending means a→z & descending means z→a
    - For numbers - ascending means 0→9 & descending means 9→0
    - In case numbers & alphabets both are there, then ascending would mean numbers first, then letters & descending means alphabets first, then numbers
- As a user, I will be able to sort the data using a one-column, then, when I sort the data using another column, the sorting via the first column will be reset, and the whole sorting shifts to another column


## Story 6 - Filtering data
- As a user, I should be able to filter the rows of data via one or more columns
- As a user, I should be able to click the filter icon, again given beside the name of the column and then select the values from the list of values being shown there (on some UI, I haven’t decided yet). The list of values should be all the distinct values that the column contains
- As a user, while selecting values for filtering, they should be searchable, in case the number of distinct options is more than 5
- As a user for columns having numerical values (auto-detected by the system), I should be able to filter values according to logical comparison with static values, for examples
    -  greater than 5,
    - less than 456
    -  equal to 34


## Story 7 - Selecting data
- As a user, I should be able to select the data in continuous cells aligned near each other
- As a user, I should be able to select data by starting from one cell by clicking on it and holding the click, and then dragging the mouse pointer to another cell, holding the click
- As a user, clicking the title of the column would select the entire column in one go
- As a user, clicking the title of the row would select the entire row in one go
## Story 8 - Formulas on numerical data
- As a user, when I select multiple cells using the mouse (using the method above), if all the cells contain numerical values, then in a separate place, I should be able to see the following aggregations for all the numerical values selected
    - Sum of numbers
    - Average of numbers
    - Maximum value
    - Minimum value
## Story 9 - Editing Values
- As a user, I should be able to edit the values of the cell via one of the following methods
    - By double-clicking a cell, it becomes editable, and the cursor starts blinking on it
    - If the cell is already focused, then clicking Enter will make it editable, and the cursor will start blinking on it
- As a user, while editing the values, the following should happen when I press different keys
    - When I press shift+enter, a newline should be inserted in the cell where I am editing
    - When I press the escape key, the cell where I am editing content should move to the uneditable state, and focus should remain on that cell
        - Unlike popular spreadsheet applications, pressing the escape key shouldn’t reset the text of the cell to the value which was before editing started. Whatever value the user had written in editing mode should be retained
    - When I press the tab key, the cell should go back to its uneditable state, and focus should be moved to the next cell on the right
    - When I press the enter key, the cell should go back  to its uneditable state, and focus should be moved to the next cell towards the bottom
## Story 10 - Downloading files & Saving data
- As a user, after uploading the CSV data via any of the methods given above, I should be able to come back to csvpreview.com as many times as possible and view the same data.
    - As long as I am using the same browser or browser profiles (in some cases), without any reset, I should come back to the same version of data
- As a user, I should be able to clear all the data which I have uploaded/created/edited/worked upon using a single button and bring the CSV preview.com to a fresh state
- As a user, I don’t want to save any of the changes I have made manually using a button or something else; every change I make should be auto-saved
- As a user, I should be able to download the whole CSV data in a .csv file
- As a user, I should be able to download partial data when contiguous cells are selected in a .csv file
- As a user, before downloading full or partial CSV data in a .csv file, I should be able to set the name of the file


## Story 11 - Adding/Deleting Rows/Columns
- As a user, I should be able to add a new column using a button at the top of the column towards the right edge, visible when I hover over the title of the column
- As a user, I should be able to delete an existing column, using a button which is visible just over the title of the column, visible when I hover over the title of the column
- As a user, I should be able to insert a new row using a button at the left of the row towards the bottom edge, visible when I hover over the title of the row
- As a user, I should be able to delete the entire row using a button, which is visible just left of the row title, visible when I hover over the title of the row÷


## Story 12 - Different delimiter
- As a user, I should be able to switch the delimeter from the context of the whole application using a dropdown, placed strategically at the right place. I should be able to choose b/w one of the following delimiters
    - Pipe Operator (|)
    - Space (\s)

