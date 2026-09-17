# %%
r"""
Linear Algebra Helpers

Utility functions for dense linear algebra used across the examples. The
solvers accept an arbitrary number of right-hand sides and return the
residual norm $\|A x - b\|_2$ for each system.

Mathematical background
-----------------------
Given a matrix $A \in \mathbb{C}^{m \times n}$ and a vector $b$, the least-squares
solution minimizes

$$
\|A x - b\|_2^2 = x^* A^* A x - 2\,\mathrm{Re}(x^* A^* b) + b^* b .
$$

When $A$ has full column rank, the normal equations

$$
A^* A \, x = A^* b
$$

have a unique solution $x = (A^* A)^{-1} A^* b$, and the residual satisfies
$\|A x - b\|_2 = \sigma_{\min}(A)$ for the minimum-norm problem.

References
----------
.. [1] G. H. Golub and C. F. Van Loan, Matrix Computations, 4th ed.,
       Johns Hopkins University Press (2013).
"""
